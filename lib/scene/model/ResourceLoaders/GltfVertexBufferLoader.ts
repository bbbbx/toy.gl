import defined from "../../../core/defined";
import defaultValue from "../../../core/defaultValue";
import DeveloperError from "../../../core/DeveloperError";
import Resource from "../../../core/Resource";
import Buffer from "../../../renderer/Buffer";
import BufferUsage from "../../../renderer/BufferUsage";
import Context from "../../../renderer/Context";
import GltfBufferViewLoader from "./GltfBufferViewLoader";
import ResourceLoader from "./ResourceLoader";
import ResourceLoaderState from "./ResourceLoaderState";
import ResourceCache from "../ResourceCache";
import FrameState from "../../FrameState";
import { glTF, KHRDracoMeshCompressionExtension } from "../glTF";
import Job from "../../Job";
import JobType from "../../JobType";

class CreateVertexBufferJob implements Job {
  typedArray: Uint8Array;
  context: Context;
  buffer: Buffer;

  constructor() {}

  set(typedArray: Uint8Array, context: Context) {
    this.typedArray = typedArray;
    this.context = context;
  }

  execute(): void {
    this.buffer = createVertexBuffer(this.typedArray, this.context);
  }
}


class GltfVertexBufferLoader extends ResourceLoader {
  _resourceCache: typeof ResourceCache;
  _gltf: glTF;
  _gltfResource: Resource;
  _baseResource: Resource;
  _attributeSemantic: string;
  _accessorIndex: number;
  _bufferViewIndex: number;
  _cacheKey: string;
  _asynchronous: boolean;
  _buffer: Buffer;
  _typedArray: Uint8Array;
  _loadBuffer: boolean;
  _loadTypedArray: boolean;
  _bufferViewLoader: GltfBufferViewLoader;
  _dracoLoader;
  _draco;

  _state: ResourceLoaderState;
  _promise: Promise<GltfVertexBufferLoader> | undefined;
  _process: (loader: GltfVertexBufferLoader, frameState: FrameState) => void;

  get promise() { return this._promise; }
  get buffer() { return this._buffer; }
  get typedArray() { return this._typedArray; }
  get cacheKey() { return this._cacheKey; }

  constructor(options: {
    resourceCache: typeof ResourceCache,
    gltf: glTF,
    gltfResource: Resource,
    baseResource: Resource,
    bufferViewIndex: number,
    draco: KHRDracoMeshCompressionExtension,
    attributeSemantic: string
    accessorIndex: number,
    cacheKey: string,
    asynchronous?: boolean,
    loadBuffer?: boolean,
    loadTypedArray?: boolean,
  }) {
    super();

    const bufferViewIndex = options.bufferViewIndex;
    const draco = options.draco;
    const attributeSemantic = options.attributeSemantic;
    const loadBuffer = defaultValue(options.loadBuffer, false);
    const loadTypedArray = defaultValue(options.loadTypedArray, false);
    const asynchronous = defaultValue(options.asynchronous, true);

    const hasBufferViewIndex = defined(bufferViewIndex);
    const hasDraco = hasDracoCompression(draco, attributeSemantic);

    if (hasBufferViewIndex === hasDraco) {
      throw new DeveloperError('One of options.bufferViewIndex and options.draco must be defined.');
    }

    this._resourceCache = options.resourceCache;
    this._gltf = options.gltf;
    this._gltfResource = options.gltfResource;
    this._baseResource = options.baseResource;
    this._bufferViewIndex = bufferViewIndex;
    this._draco = draco;
    this._attributeSemantic = attributeSemantic;
    this._accessorIndex = options.accessorIndex;
    this._cacheKey = options.cacheKey;
    this._asynchronous = asynchronous;
    this._loadBuffer = loadBuffer;
    this._loadTypedArray = loadTypedArray;

    this._state = ResourceLoaderState.UNLOADED;
    this._process = () => {};
  }

  load() {
    let promise;

    if (hasDracoCompression(this._draco, this._attributeSemantic)) {
      promise = loadFromDraco(this);
    } else {
      promise = loadFromBufferView(this);
    }

    const vertexBufferLoader = this;
    const scratchVertexBufferJob = new CreateVertexBufferJob();
    const processPromise = new Promise(function (resolve) {
      vertexBufferLoader._process = function(loader: GltfVertexBufferLoader, frameState: FrameState) {
        if (loader._state === ResourceLoaderState.READY) {
          return;
        }

        if (defined(loader._dracoLoader)) {
          loader._dracoLoader.process(frameState);
        }

        if (defined(loader._bufferViewLoader)) {
          loader._bufferViewLoader.process(frameState)
        }

        const typedArray = loader._typedArray;
        if (!defined(typedArray)) {
          // Buffer view hasn't been loaded yet
          return;
        }

        let buffer: Buffer;
        if (loader._loadBuffer && loader._asynchronous) {

          const vertexBufferJob = scratchVertexBufferJob;
          vertexBufferJob.set(typedArray, frameState.context);
          if (!frameState.jobScheduler.execute(vertexBufferJob, JobType.BUFFER)) {
            // Job scheduler is full. Try again next frame.
            return;
          }
          buffer = vertexBufferJob.buffer;

        } else if (loader._loadBuffer) {

          buffer = createVertexBuffer(typedArray, frameState.context);

        }

        loader.unload();

        loader._buffer = buffer;
        // loader._typedArray = loader._loadTypedArray ? typedArray : undefined;
        loader._typedArray = typedArray;
        loader._state = ResourceLoaderState.READY;
        resolve(loader);
      };

    });

    this._promise = promise
      .then(function() {
        if (vertexBufferLoader.isDestroyed()) {
          return;
        }

        return processPromise;
      })
      .catch(function(error) {
        if (vertexBufferLoader.isDestroyed()) {
          return;
        }

        return handleError(vertexBufferLoader, error);
      });

    return this._promise;
  }

  public process(frameState: FrameState): void {
    return this._process(this, frameState);
  }

  unload() {
    if (defined(this._buffer)) {
      this._buffer.destroy();
    }
  
    const resourceCache = this._resourceCache;
  
    if (defined(this._bufferViewLoader)) {
      resourceCache.unload(this._bufferViewLoader);
    }
  
    if (defined(this._dracoLoader)) {
      resourceCache.unload(this._dracoLoader);
    }
  
    this._bufferViewLoader = undefined;
    this._dracoLoader = undefined;
    this._typedArray = undefined;
    this._buffer = undefined;
    this._gltf = undefined;
  }
}

function createVertexBuffer(typedArray: Uint8Array, context: Context): Buffer {
  const buffer = Buffer.createVertexBuffer({
    typedArray: typedArray,
    context: context,
    usage: BufferUsage.STATIC_DRAW,
  });
  buffer.vertexArrayDestroyable = false;
  return buffer;
}

function loadFromDraco(vertexBufferLoader: GltfVertexBufferLoader) {
  
}

function loadFromBufferView(vertexBufferLoader: GltfVertexBufferLoader) {
  const resourceCache = vertexBufferLoader._resourceCache;
  const bufferViewLoader = resourceCache.loadBufferView({
    gltf: vertexBufferLoader._gltf,
    bufferViewIndex: vertexBufferLoader._bufferViewIndex,
    gltfResource: vertexBufferLoader._gltfResource,
    baseResource: vertexBufferLoader._baseResource,
  });
  vertexBufferLoader._state = ResourceLoaderState.LOADING;
  vertexBufferLoader._bufferViewLoader = bufferViewLoader;

  return bufferViewLoader.promise.then(function () {
    if (vertexBufferLoader.isDestroyed()) {
      return;
    }
    // Now wait for process() to run to finish loading
    vertexBufferLoader._typedArray = bufferViewLoader.typedArray;
    vertexBufferLoader._state = ResourceLoaderState.PROCESSING;
    return vertexBufferLoader;
  });
}

function hasDracoCompression(draco: KHRDracoMeshCompressionExtension, semantic: string) : boolean {
  return (
    defined(draco) &&
    defined(draco.attributes) &&
    defined(draco.attributes[semantic])
  );
}

function handleError(vertexBufferLoader: GltfVertexBufferLoader, error: Error) {
  vertexBufferLoader.unload();
  vertexBufferLoader._state = ResourceLoaderState.FAILED;
  const errorMessage = 'Failed to load vertex buffer';
  error = vertexBufferLoader.getError(errorMessage, error);
  return Promise.reject(error);
}

export default GltfVertexBufferLoader;
