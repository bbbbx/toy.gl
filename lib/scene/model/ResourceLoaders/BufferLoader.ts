import Resource from "../../../core/Resource";
import defined from "../../../core/defined";
import FrameState from "../../FrameState";
import ResourceLoader from "./ResourceLoader";
import ResourceLoaderState from "./ResourceLoaderState";

class BufferLoader extends ResourceLoader {
  process(frameState: FrameState) {
    throw new Error("Method not implemented.");
  }
  _typedArray: Uint8Array;
  _resource: Resource;
  _cacheKey: string;
  _state: ResourceLoaderState;
  _promise: Promise<BufferLoader> | undefined;

  get typedArray() { return this._typedArray; }
  get cacheKey() { return this._cacheKey; }
  get promise() { return this._promise; }

  constructor(options: {
    typedArray?: Uint8Array,
    resource?: Resource,
    cacheKey: string,
  }) {
    super();

    const typedArray = options.typedArray;
    const resource = options.resource;

    if (defined(typedArray) === defined(resource)) {
      throw new Error("One of options.typedArray and options.resource must be defined.");
    }

    this._typedArray = typedArray;
    this._resource = resource;
    this._cacheKey = options.cacheKey;
    this._state = ResourceLoaderState.UNLOADED;
  }

  public load() {
    if (defined(this._typedArray)) {
      this._promise = Promise.resolve(this);
    } else {
      this._promise = loadExternalBuffer(this);
    }

    return this._promise;
  }

  public unload(): void {
    this._typedArray = undefined;
  }
}

function loadExternalBuffer(bufferLoader: BufferLoader) {
  bufferLoader._state = ResourceLoaderState.LOADING;

  const resource = bufferLoader._resource;
  return resource.fetchArrayBuffer()
    .then(function(arrayBuffer) {
      if (bufferLoader.isDestroyed()) {
        return;
      }

      bufferLoader._typedArray = new Uint8Array(arrayBuffer);
      bufferLoader._state = ResourceLoaderState.READY;
      return bufferLoader;
    })
    .catch(function (error) {
      if (bufferLoader.isDestroyed()) {
        return;
      }

      bufferLoader._state = ResourceLoaderState.FAILED;
      const errorMessage = `Failed to load external buffer: ${resource.url}`;
      return Promise.reject(bufferLoader.getError(errorMessage, error));
    });
}

export default BufferLoader;
