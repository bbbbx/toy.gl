import CullingVolume from "../core/CullingVolume";
import Context from "../renderer/Context";
import DrawCommand from "../renderer/DrawCommand";
import Camera from "./Camera";
import JobScheduler from "./JobScheduler";
import Clock from "../core/Clock";

/**
 * @public
 */
class FrameState {
  context: Context;
  jobScheduler: JobScheduler;
  camera: Camera;
  cullingVolume: CullingVolume;
  commandList: DrawCommand[];
  clock: Clock;

  constructor(context: Context, jobScheduler: JobScheduler) {
    this.context = context;
    this.jobScheduler = jobScheduler;
    this.commandList = [];
  }
}

export default FrameState;
