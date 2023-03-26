import IndexDatatype from "../../../core/IndexDatatype";
import Resource from "../../../core/Resource";
import defaultValue from "../../../core/defaultValue";
import defined from "../../../core/defined";
import deprecationWarning from "../../../core/deprecationWarning";
import getIndexDatatypeSizeInBytes from "../../../core/getIndexDatatypeSizeInBytes";
import Buffer from "../../../renderer/Buffer";
import BufferUsage from "../../../renderer/BufferUsage";
import Context from "../../../renderer/Context";
import FrameState from "../../FrameState";
import ResourceCache from "../ResourceCache";
import { glTF, KHRDracoMeshCompressionExtension } from "../glTF";
import ResourceLoader from "./ResourceLoader";
import GltfBufferViewLoader from "./GltfBufferViewLoader";
import GltfDracoLoader from "./GltfDracoLoader";
import ResourceLoaderState from "./ResourceLoaderState";
import Job from "../../Job";
import JobType from "../../JobType";

class CreateIndexBufferJob implements Job {
  typedArray: Uint8Array;
  indexDatatype: IndexDatatype;
  context: Context;
  buffer: Buffer;

  constructor() {}

  set(typedArray: Uint8Array, indexDatatype: IndexDatatype, context: Context) {
    this.typedArray = typedArray;
    this.indexDatatype = indexDatatype;
    this.context = context;
  }

  execute(): void {
    this.buffer = createIndexBuffer(this.typedArray, this.indexDatatype, this.context);
  }
}

const scratchIndexBufferJob = new CreateIndexBufferJob();

class GltfIndexBufferLoader extends ResourceLoader {
  _resourceCache: typeof ResourceCache;
  _gltf: glTF;
  _accessorIndex: number;
  _draco: KHRDracoMeshCompressionExtension;
  _gltfResource: Resource;
  _baseResource: Resource;
  _indexDatatype: IndexDatatype;
  _bufferViewLoader: GltfBufferViewLoader;
  _dracoLoader: GltfDracoLoader;
  _buffer: Buffer;
  _typedArray: Uint8Array;
  _asynchronous: boolean;
  _cacheKey: string;
  _loadBuffer: boolean;
  _loadTypedArray: boolean;
  _state: ResourceLoaderState;
  _promise: Promise<GltfIndexBufferLoader> | undefined;

  _process: (loader: GltfIndexBufferLoader, frameState: FrameState) => void;

  get promise() { return this._promise; }
  get indexDatatype() { return this._indexDatatype; }
  get buffer() { return this._buffer; }
  get typedArray() { return this._typedArray; }
  get cacheKey() { return this._cacheKey; }

  constructor(options: {
    resourceCache: typeof ResourceCache,
    gltf: glTF,
    accessorIndex: number,
    gltfResource: Resource,
    baseResource: Resource,
    draco: KHRDracoMeshCompressionExtension,
    cacheKey: string,
    asynchronous?: boolean,
    loadBuffer?: boolean,
    loadTypedArray?: boolean,
  }) {
    super();

    const resourceCache = options.resourceCache;
    const gltf = options.gltf;
    const accessorIndex = options.accessorIndex;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;
    const draco = options.draco;
    const cacheKey = options.cacheKey;
    const asynchronous = defaultValue(options.asynchronous, true);
    const loadBuffer = defaultValue(options.loadBuffer, false);
    const loadTypedArray = defaultValue(options.loadTypedArray, false);

    const indexDatatype = gltf.accessors[accessorIndex].componentType;

    this._resourceCache = resourceCache;
    this._gltfResource = gltfResource;
    this._baseResource = baseResource;
    this._gltf = gltf;
    this._accessorIndex = accessorIndex;
    this._indexDatatype = indexDatatype;
    this._draco = draco;
    this._cacheKey = cacheKey;
    this._asynchronous = asynchronous;
    this._loadBuffer = loadBuffer;
    this._loadTypedArray = loadTypedArray;

    this._state = ResourceLoaderState.UNLOADED;
    this._process = function (loader, frameState) {};
  }

  load() {
    let promise;

    if (defined(this._draco)) {
      promise = loadFromDraco(this);
    } else {
      promise = loadFromBufferView(this);
    }

    const indexBufferLoader = this;
    const processPromise: Promise<GltfIndexBufferLoader> = new Promise(function(resolve) {
      indexBufferLoader._process = function(loader: GltfIndexBufferLoader, frameState: FrameState) {
        if (loader._state === ResourceLoaderState.READY) {
          return;
        }

        const typedArray = loader._typedArray;
        const indexDatatype = loader._indexDatatype;

        if (defined(loader._dracoLoader)) {
          loader._dracoLoader.process(frameState);
        }
        if (defined(loader._bufferViewLoader)) {
          loader._bufferViewLoader.process(frameState);
        }

        if (!defined(typedArray)) {
          // Buffer view hasn't been loaded yet
          return;
        }

        let buffer: Buffer;
        if (loader._loadBuffer && loader._asynchronous) {

          const indexBufferJob = scratchIndexBufferJob;
          indexBufferJob.set(typedArray, indexDatatype, frameState.context);
          if (! frameState.jobScheduler.execute(indexBufferJob, JobType.BUFFER)) {
            // Job scheduler is full. Try again next frame.
            return;
          }
          buffer = indexBufferJob.buffer;

        } else if (loader._loadBuffer) {
          buffer = createIndexBuffer(typedArray, indexDatatype, frameState.context);
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
      .then(function () {
        if (indexBufferLoader.isDestroyed()) {
          return;
        }

        return processPromise;
      })
      .catch(function (error) {
        if (indexBufferLoader.isDestroyed()) {
          return;
        }
  
        return handleError(indexBufferLoader, error);
      });

    return this._promise;
  }

  public unload(): void {
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

  process(frameState: FrameState) {
    return this._process(this, frameState);
  }
}

function loadFromDraco(indexBufferLoader: GltfIndexBufferLoader) {
  throw new Error("loadFromDraco: To be implemented");
}

function loadFromBufferView(indexBufferLoader: GltfIndexBufferLoader) {
  const gltf = indexBufferLoader._gltf;
  const accessorIndex = indexBufferLoader._accessorIndex;
  const accessor = gltf.accessors[accessorIndex];
  const bufferViewIndex = accessor.bufferView;

  const resourceCache = indexBufferLoader._resourceCache;
  let bufferViewLoader = resourceCache.loadBufferView({
    gltf: gltf,
    bufferViewIndex: bufferViewIndex,
    gltfResource: indexBufferLoader._gltfResource,
    baseResource: indexBufferLoader._baseResource,
  });
  indexBufferLoader._state = ResourceLoaderState.LOADING;
  indexBufferLoader._bufferViewLoader = bufferViewLoader;

  return bufferViewLoader.promise.then(function () {
    if (bufferViewLoader.isDestroyed()) {
      return;
    }

    // Now wait for process() to run to finish loading
    const bufferViewTypedArray = bufferViewLoader.typedArray;
    indexBufferLoader._typedArray = createIndicesTypedArray(
      indexBufferLoader,
      bufferViewTypedArray
    );
    indexBufferLoader._state = ResourceLoaderState.PROCESSING;
    return indexBufferLoader;
  });

}
function createIndicesTypedArray(indexBufferLoader: GltfIndexBufferLoader, bufferViewTypedArray: Uint8Array) : Uint8Array {
  const gltf = indexBufferLoader._gltf;
  const accessorIndex = indexBufferLoader._accessorIndex;
  const accessor = gltf.accessors[accessorIndex];
  const count = accessor.count;
  const indexDatatype = accessor.componentType;
  const indexSize = getIndexDatatypeSizeInBytes(indexDatatype);

  let arrayBuffer = bufferViewTypedArray.buffer;
  let byteOffset = bufferViewTypedArray.byteOffset + accessor.byteOffset;

  if (byteOffset % indexSize !== 0) {
    const byteLength = count * indexSize;
    const view = new Uint8Array(arrayBuffer, byteOffset, byteLength);
    const copy = new Uint8Array(view);
    arrayBuffer = copy.buffer;
    byteOffset = 0;
    deprecationWarning(
      'index-buffer-unaligned',
      `The index array is not aligned to a ${indexSize}-byte boundary.`
    );
  }

  let typedArray;
  if (indexDatatype === IndexDatatype.UNSIGNED_BYTE) {
    typedArray = new Uint8Array(arrayBuffer, byteOffset, count);
  } else if (indexDatatype === IndexDatatype.UNSIGNED_SHORT) {
    typedArray = new Uint16Array(arrayBuffer, byteOffset, count);
  } else if (indexDatatype === IndexDatatype.UNSIGNED_INT) {
    typedArray = new Uint32Array(arrayBuffer, byteOffset, count);
  }

  return typedArray;
}

function createIndexBuffer(typedArray: Uint8Array, indexDatatype: IndexDatatype, context: Context) : Buffer {
  const buffer = Buffer.createIndexBuffer({
    context: context,
    indexDatatype: indexDatatype,
    typedArray: typedArray,
    usage: BufferUsage.STATIC_DRAW,
  });
  buffer.vertexArrayDestroyable = false;

  return buffer;
}

function handleError(indexBufferLoader: GltfIndexBufferLoader, error: Error) {
  indexBufferLoader.unload();
  indexBufferLoader._state = ResourceLoaderState.FAILED;
  const errorMessage = 'Failed to load index buffer';
  error = indexBufferLoader.getError(errorMessage, error);
  return Promise.reject(error);
}

export default GltfIndexBufferLoader;
