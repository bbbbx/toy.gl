import RuntimeError from "../../../core/RuntimeError";
import defined from "../../../core/defined";
import destroyObject from "../../../core/destroyObject";
import FrameState from "../../FrameState";

abstract class ResourceLoader {
  constructor() {}

  abstract get promise(): Promise<ResourceLoader>;
  abstract get cacheKey(): string;

  abstract load()

  abstract unload()

  abstract process(frameState: FrameState)

  public getError(errorMessage: string, error?: Error) {
    if (defined(error)) {
      errorMessage += `\n${error.message}`;
    }

    const runtimeError = new RuntimeError(errorMessage);
    if (defined(error)) {
      runtimeError.stack = `Original stack:\n${error.stack}\nHandler stack:\n${runtimeError.stack}`;
    }

    return runtimeError;
  }

  public isDestroyed() : boolean { return false; }

  public destroy() {
    this.unload();
    return destroyObject(this);
  }
}

export default ResourceLoader;
