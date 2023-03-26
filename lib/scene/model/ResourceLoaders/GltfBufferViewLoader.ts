import Resource from "../../../core/Resource";
import defined from "../../../core/defined";
import getAbsoluteUri from "../../../core/getAbsoluteUri";
import FrameState from "../../FrameState";
import ResourceCache from "../ResourceCache";
import { glTF, Buffer } from "../glTF";
import hasExtension from "../hasExtension";
import BufferLoader from "./BufferLoader";
import ResourceLoader from "./ResourceLoader";
import ResourceLoaderState from "./ResourceLoaderState";

class GltfBufferViewLoader extends ResourceLoader {
  _gltf: glTF;
  _bufferViewIndex: number;
  _bufferIndex: number;
  _byteOffset: number;
  _byteLength: number;
  _buffer: Buffer;
  _cacheKey: string;
  _gltfResource: Resource;
  _baseResource: Resource;
  _bufferLoader: BufferLoader;
  _typedArray: Uint8Array;
  _state: ResourceLoaderState;
  _hasMeshopt: boolean;
  _promise: Promise<GltfBufferViewLoader> | undefined;
  _process: (loader: GltfBufferViewLoader, frameState) => void;

  _resourceCache: typeof ResourceCache;

  get promise(): Promise<GltfBufferViewLoader> | undefined { return this._promise; }
  get typedArray(): Uint8Array | undefined { return this._typedArray; }
  get cacheKey(): string { return this._cacheKey; }

  constructor(options: {
    resourceCache: typeof ResourceCache,
    gltf: glTF,
    bufferViewIndex: number
    gltfResource: Resource,
    baseResource: Resource,
    cacheKey: string,
  }) {
    super();

    const resourceCache = options.resourceCache;
    const gltf = options.gltf;
    const bufferViewIndex = options.bufferViewIndex;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;
    const cacheKey = options.cacheKey;

    const bufferView = gltf.bufferViews[bufferViewIndex];
    const bufferIndex = bufferView.buffer;
    const byteOffset = bufferView.byteOffset;
    const byteLength = bufferView.byteLength;

    let hasMeshopt = false;
    if (hasExtension(bufferView, 'EXT_meshopt_compression')) {
      throw new Error("GltfBufferViewLoader: To be implemented");
    }

    const buffer = gltf.buffers[bufferIndex];

    this._resourceCache = resourceCache;
    this._gltf = gltf;
    this._gltfResource = gltfResource;
    this._baseResource = baseResource;
    this._buffer = buffer;
    this._bufferIndex = bufferIndex;
    this._byteOffset = byteOffset;
    this._byteLength = byteLength;
    this._cacheKey = cacheKey;

    this._hasMeshopt = hasMeshopt;
    this._state = ResourceLoaderState.UNLOADED;
    this._process = () => {};
  }

  load() {
    const bufferLoader = getBufferLoader(this);
    this._bufferLoader = bufferLoader;
    this._state = ResourceLoaderState.LOADING;

    const bufferViewLoader = this;
    const bufferViewPromise: Promise<GltfBufferViewLoader> = new Promise(function (resolve) {
      bufferViewLoader._process = function(loader: GltfBufferViewLoader, frameState: FrameState) {
        if (!loader._hasMeshopt) {
          return;
        }

        if (!defined(loader._typedArray)) {
          return;
        }

        if (loader._state !== ResourceLoaderState.PROCESSING) {
          return;
        }

        resolve(loader);
      };
    });

    this._promise = bufferLoader.promise
      .then(function() {
        if (bufferViewLoader.isDestroyed()) {
          return;
        }

        const bufferTypedArray = bufferLoader.typedArray;
        const bufferViewTypedArray = new Uint8Array(
          bufferTypedArray.buffer,
          bufferTypedArray.byteOffset + bufferViewLoader._byteOffset,
          bufferViewLoader._byteLength
        );

        bufferViewLoader.unload();
        bufferViewLoader._typedArray = bufferViewTypedArray;

        if (bufferViewLoader._hasMeshopt) {
          bufferViewLoader._state = ResourceLoaderState.PROCESSING;
          return bufferViewPromise;
        }

        bufferViewLoader._state = ResourceLoaderState.READY;
        return bufferViewLoader;
      })
      .catch(function (error) {
        if (bufferViewLoader.isDestroyed()) {
          return;
        }

        bufferViewLoader.unload();

        bufferViewLoader._state = ResourceLoaderState.FAILED;

        const errorMessage = 'Failed to load buffer view';
        return Promise.reject(bufferViewLoader.getError(errorMessage, error));
      });

    return this._promise;
  }

  process(frameState) {
    return this._process(this, frameState);
  }

  unload() {
    if (defined(this._bufferLoader)) {
      this._resourceCache.unload(this._bufferLoader);
    }
  
    this._bufferLoader = undefined;
    this._typedArray = undefined;
  }
}

function getBufferLoader(bufferViewLoader: GltfBufferViewLoader) {
  const resourceCache = bufferViewLoader._resourceCache;
  const buffer = bufferViewLoader._buffer;
  if (defined(buffer.uri)) {
    const derivedResource = bufferViewLoader._baseResource.getDerivedResource({
      url: buffer.uri,
    });

    return resourceCache.loadExternalBuffer({
      resource: derivedResource,
    });
  }

  return resourceCache.loadEmbeddedBuffer({
    parentResource: bufferViewLoader._gltfResource,
    bufferIndex: bufferViewLoader._bufferIndex,
  });
}

export default GltfBufferViewLoader;
