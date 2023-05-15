import defined from "./defined";

/**
 * Gets a timestamp that can be used in measuring the time between events.
 * Timestamps are expressed in milliseconds, but it is not specified what the
 * milliseconds are measured from. This function uses performance.now() if it
 * is available, or Date.now() otherwise.
 */
let getTimestamp: () => number;

if (
  defined(performance) &&
  typeof performance.now === 'function' &&
  isFinite(performance.now())
) {
  getTimestamp = function () {
    return performance.now();
  }
} else {
  getTimestamp = function () {
    return Date.now();
  }
}

export default getTimestamp;