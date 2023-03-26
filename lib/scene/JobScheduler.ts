import defined from "../core/defined";
import DeveloperError from "../core/DeveloperError";
import getTimestamp from "../core/getTimestamp";
import Job from "./Job";
import JobType from "./JobType";

class JobTypeBudget {
  /** @internal Total budget, in milliseconds, allowed for one frame */
  _total: number;
  /**
   * Time, in milliseconds, used so far during this frame
   */
  usedThisFrame: number;
  /**
   * Time, in milliseconds, that other job types stole this frame
   */
  stolenFromMeThisFrame: number;
  /**
   * Indicates if this job was starved this frame. i.e., a job
   * tried to run but didn't have budget
   */
  starvedThisFrame: boolean;
  /**
   * Indicates if this job was starved last frame. This prevents it
   * from being stolen from this frame
   */
  starvedLastFrame: boolean;

  public get total() { return this._total; }

  constructor(total: number) {
    this._total = total;
    this.usedThisFrame = 0.0;
    this.stolenFromMeThisFrame = 0.0;
    this.starvedThisFrame = false;
    this.starvedLastFrame = false;
  }
}

/**
 * @public
 */
class JobScheduler {
  _totalBudget: number;
  _totalUsedThisFrame: number;
  _budgets: JobTypeBudget[];
  _executedThisFrame: boolean[];

  public get totalBudget() { return this._totalBudget; }

  constructor(budgets?: number[]) {
    if (defined(budgets) && budgets.length !== JobType.NUMBER_OF_JOB_TYPES) {
      throw new DeveloperError('A budget must be specified for each job type; budgets.length should equal JobType.NUMBER_OF_JOB_TYPES');
    }

    // Total for defaults is half of of one frame at 10 fps
    const jobBudgets: JobTypeBudget[] = new Array(JobType.NUMBER_OF_JOB_TYPES);
    jobBudgets[JobType.TEXTURE] = new JobTypeBudget(defined(budgets) ? budgets[JobType.TEXTURE] : 10.0);
    // On cache miss, this most likely only allows one shader compile per frame
    jobBudgets[JobType.PROGRAM] = new JobTypeBudget(defined(budgets) ? budgets[JobType.PROGRAM] : 10.0);
    jobBudgets[JobType.BUFFER] = new JobTypeBudget(defined(budgets) ? budgets[JobType.BUFFER] : 30.0);

    let totalBudget = 0.0;
    const length = jobBudgets.length
    for (let i = 0; i < length; i++) {
      totalBudget += jobBudgets[i].total;
    }

    const executedThisFrame: boolean[] = new Array(length).fill(false);

    this._totalBudget = totalBudget;
    this._totalUsedThisFrame = 0.0;
    this._budgets = jobBudgets;
    this._executedThisFrame = executedThisFrame;
  }

  disableThisFrame() {
    // Prevent jobs from running this frame
    this._totalUsedThisFrame = this._totalBudget;
  }

  resetBudgets() {
    const budgets = this._budgets;
    const length = budgets.length;
    for (let i = 0; i < length; i++) {
      const budget = budgets[i];
      budget.starvedLastFrame = budget.starvedThisFrame;
      budget.starvedThisFrame = false;
      budget.usedThisFrame = 0.0;
      budget.stolenFromMeThisFrame = 0.0;
    }

    this._totalUsedThisFrame = 0.0;
  }

  execute(job: Job, jobType: JobType) {
    const budgets = this._budgets;
    const budget = budgets[jobType];

    // This ensure each job type makes progress each frame by executing at least once
    const progressThisFrame = this._executedThisFrame[jobType];
    if (this._totalUsedThisFrame >= this._totalBudget && progressThisFrame) {
      // No budget left this frame for jobs of any type
      budget.starvedThisFrame = true;
      return false;
    }

    let stolenBudget: JobTypeBudget;

    // No budget remaining for jobs of this type. Try to steal from other job types.
    if ((budget.usedThisFrame + budget.stolenFromMeThisFrame) >= budget.total) {
      const length = budgets.length;
      let i: number;
      for (i = 0; i < length; i++) {
        stolenBudget = budgets[i];

        // Steal from this budget if it has time left and it wasn't starved last frame
        if (
          stolenBudget.usedThisFrame + stolenBudget.stolenFromMeThisFrame < stolenBudget.total &&
          ! stolenBudget.starvedLastFrame
        ) {
          break;
        }
      }

      if (i === length && progressThisFrame) {
        // No other job types can give up their budget this frame, and
        // this job type already progressed this frame
        return false;
      }

      if (progressThisFrame) {
        // It is considered "starved" even if it executes using stolen time so that
        // next frame, no other job type can steal time from it.
        budget.starvedThisFrame = true;
      }
    }

    const startTime = getTimestamp();
    job.execute();
    const duration = getTimestamp() - startTime;

    // Track both time remaining for this job type and all jobs,
    // so budget stealing does send us way over the total budget.
    this._totalUsedThisFrame += duration;

    if (defined(stolenBudget)) {
      stolenBudget.stolenFromMeThisFrame += duration;
    } else {
      budget.usedThisFrame += duration;
    }
    this._executedThisFrame[jobType] = true;

    return true;
  }
}

export default JobScheduler;
