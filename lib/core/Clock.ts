import getTimestamp from "./getTimestamp";

class Clock {
  _currentTime: Date;
  _lastSystemTime: number;

  constructor() {
    
  }

  tick() {
    const currentSystemTime = getTimestamp();
    const currentTime = new Date();

    this._currentTime = currentTime;
    this._lastSystemTime = currentSystemTime;

    return currentTime;
  }
}

export default Clock;
