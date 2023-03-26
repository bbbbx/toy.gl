import Resource from "../../../core/Resource";
import defined from "../../../core/defined";
import FrameState from "../../FrameState";
import getMagic from "../../getMagic";
import ForEach from "../GltfPipeline/ForEach";
import addDefaults from "../GltfPipeline/addDefaults";
import addPipelineExtras from "../GltfPipeline/addPipelineExtras";
import removePipelineExtras from "../GltfPipeline/removePipelineExtras";
import ResourceCache from "../ResourceCache";
import getJsonFromTypedArray from "../getJsonFromTypedArray";
import isDataUri from "../isDataUri";
import parseGlb from "../parseGlb";
import BufferLoader from "./BufferLoader";
import ResourceLoader from "./ResourceLoader";
import ResourceLoaderState from "./ResourceLoaderState";
import { glTF, Buffer } from "../glTF";
import usesExtension from "../GltfPipeline/usesExtension";


class GltfJsonLoader extends ResourceLoader {
  _resourceCache: typeof ResourceCache;
  _gltfResource: Resource;
  _baseResource: Resource;
  _typedArray: Uint8Array;
  _gltfJson: glTF;
  _gltf: glTF;
  _cacheKey: string;

  _bufferLoaders: BufferLoader[];
  _state: ResourceLoaderState;
  _promise: Promise<GltfJsonLoader>;

  get promise() { return this._promise; }
  get cacheKey(): string { return this._cacheKey; }
  get gltf() { return this._gltf; }

  constructor(options: {
    resourceCache: typeof ResourceCache,
    gltfResource: Resource,
    baseResource: Resource,
    cacheKey: string,
    typedArray?: Uint8Array,
    gltfJson?,
  }) {
    super();

    this._resourceCache = options.resourceCache;
    this._gltfResource = options.gltfResource;
    this._baseResource = options.baseResource;
    this._typedArray = options.typedArray;
    this._gltfJson = options.gltfJson;
    this._cacheKey = options.cacheKey
    
    this._bufferLoaders = [];
    this._state = ResourceLoaderState.UNLOADED;
  }

  load() {
    this._state = ResourceLoaderState.LOADING;

    let processPromise: Promise<glTF>;
    if (defined(this._gltfJson)) {
      processPromise = processGltfJson(this, this._gltfJson);
    } else if (defined(this._typedArray)) {
      processPromise = processGltfTypedArray(this, this._typedArray);
    } else {
      processPromise = loadFromUri(this);
    }

    const gltfJsonLoader = this;
    this._promise = processPromise
      .then(function(gltf) {
        if (gltfJsonLoader.isDestroyed()) {
          return;
        }

        gltfJsonLoader._gltf = gltf;
        gltfJsonLoader._state = ResourceLoaderState.READY;
        return gltfJsonLoader;
      })
      .catch(function (error) {
        if (gltfJsonLoader.isDestroyed()) {
          return;
        }

        return handleError(gltfJsonLoader, error);
      });

    return this._promise;
  }

  process(frameState: FrameState) {
    throw new Error("GltfJsonLoader Method not implemented.");
  }

  unload() {
    const bufferLoaders = this._bufferLoaders;
    const bufferLoadersLength = bufferLoaders.length;
    for (let i = 0; i < bufferLoadersLength; ++i) {
      this._resourceCache.unload(bufferLoaders[i]);
    }
    this._bufferLoaders.length = 0;

    this._gltf = undefined;
  }

  _fetchGltf() {
    return this._gltfResource.fetchArrayBuffer();
  }
}

function decodeDataUris(gltf: glTF) : Promise<void[]> {
  const promises: Promise<void>[] = [];

  ForEach.buffer(gltf, function (buffer) {
    const bufferUri = buffer.uri;

    if (
      !defined(buffer.extras._pipeline.source) && // Ignore uri if this buffer uses the glTF 1.0 KHR_binary_glTF extension
      defined(bufferUri) &&
      isDataUri(bufferUri)
    ) {
      delete buffer.uri; // Delete the data URI to keep the cached glTF JSON small

      const promise = Resource.fetchArrayBuffer(bufferUri)
        .then(function (arrayBuffer) {
          buffer.extras._pipeline.source = new Uint8Array(arrayBuffer);
        });
      promises.push(promise);
    }

  });

  return Promise.all(promises);
}

function upgradeVersion(gltfJsonLoader: GltfJsonLoader, gltf: glTF) {
  if (
    defined(gltf.asset) &&
    gltf.asset.version === '2.0' &&
    !usesExtension(gltf, 'KHR_techniques_webgl') &&
    !usesExtension(gltf, 'KHR_materials_common')
  ) {
    return Promise.resolve();
  }

  throw new Error("upgradeVersion: To be implemented");
}

function loadEmbeddedBuffers(gltfJsonLoader: GltfJsonLoader, gltf: glTF) {
  const promises = [];
  ForEach.buffer(gltf, function (buffer: Buffer, bufferIndex: number) {
    const source = buffer.extras._pipeline.source; // Added at parseGlb

    if (defined(source) && !defined(buffer.uri)) {
      const resourceCache = gltfJsonLoader._resourceCache;

      // 加入 ResourceCache，以便 GltfLoader 获取
      const bufferLoader = resourceCache.loadEmbeddedBuffer({
        parentResource: gltfJsonLoader._gltfResource,
        bufferIndex: bufferIndex,
        typedArray: source,
      });

      gltfJsonLoader._bufferLoaders.push(bufferLoader);

      promises.push(bufferLoader.promise);
    }
  });

  return Promise.all(promises);
}

/**
 * Load data URIs
 * Add default value for glTF JSON
 * Load embedded buffers
 * @private
 * @param gltfJsonLoader 
 * @param gltf 
 */
function processGltfJson(gltfJsonLoader: GltfJsonLoader, gltf) {
  addPipelineExtras(gltf);

  return decodeDataUris(gltf)
    .then(function() {
      return upgradeVersion(gltfJsonLoader, gltf);
    })
    .then(function() {
      addDefaults(gltf);
      return loadEmbeddedBuffers(gltfJsonLoader, gltf);
    })
    .then(function() {
      removePipelineExtras(gltf);
      return gltf;
    });
}

function processGltfTypedArray(gltfJsonLoader: GltfJsonLoader, typedArray: Uint8Array) {
  let gltf: glTF;
  if (getMagic(typedArray) === 'glTF') {
    gltf = parseGlb(typedArray);
  } else {
    gltf = getJsonFromTypedArray(typedArray);
  }

  return processGltfJson(gltfJsonLoader, gltf);
}

function loadFromUri(gltfJsonLoader: GltfJsonLoader) {
  return gltfJsonLoader._fetchGltf().then(function (arrayBuffer: ArrayBuffer) {
    if (gltfJsonLoader.isDestroyed()) {
      return;
    }

    const typedArray = new Uint8Array(arrayBuffer);
    return processGltfTypedArray(gltfJsonLoader, typedArray);
  });
}

function handleError(gltfJsonLoader: GltfJsonLoader, error: Error) {
  gltfJsonLoader.unload();
  gltfJsonLoader._state = ResourceLoaderState.FAILED;
  const errorMessage = `Failed to load glTF: ${gltfJsonLoader._gltfResource.url}`;
  return Promise.reject(gltfJsonLoader.getError(errorMessage, error));
}

export default GltfJsonLoader;
