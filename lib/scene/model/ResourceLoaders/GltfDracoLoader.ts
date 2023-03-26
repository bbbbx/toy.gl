import FrameState from "../../FrameState";
import ResourceLoader from "./ResourceLoader";

class GltfDracoLoader extends ResourceLoader {
  unload() {
    throw new Error("Method not implemented.");
  }
  process(frameState: FrameState) {
    throw new Error("Method not implemented.");
  }
  get promise(): Promise<ResourceLoader> {
    throw new Error("Method not implemented.");
  }
  get cacheKey(): string {
    throw new Error("Method not implemented.");
  }
  load() {
    throw new Error("Method not implemented.");
  }
  constructor(options) {
    super();
  }
}

export default GltfDracoLoader;
