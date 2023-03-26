import DeveloperError from "../../core/DeveloperError";
import Resource from "../../core/Resource";
import defaultValue from "../../core/defaultValue";
import defined from "../../core/defined";
import RuntimeError from "../../core/RuntimeError";
import FrameState from "../FrameState";
import SupportedImageFormats from "./SupportedImageFormats";
import ResourceCacheKey from "./ResourceCacheKey";
import ResourceCacheStatistics from "./ResourceCacheStatistics";
import BufferLoader from "./ResourceLoaders/BufferLoader";
import GltfBufferViewLoader from "./ResourceLoaders/GltfBufferViewLoader";
import GltfIndexBufferLoader from "./ResourceLoaders/GltfIndexBufferLoader";
import GltfImageLoader from "./ResourceLoaders/GltfImageLoader";
import GltfTextureLoader from "./ResourceLoaders/GltfTextureLoader";
import GltfVertexBufferLoader from "./ResourceLoaders/GltfVertexBufferLoader";
import GltfJsonLoader from "./ResourceLoaders/GltfJsonLoader";
import ResourceLoader from "./ResourceLoaders/ResourceLoader";
import { TextureInfo, glTF, KHRDracoMeshCompressionExtension } from "./glTF";

class CacheEntry {
  referenceCount: number;
  resourceLoader: ResourceLoader;

  constructor(resourceLoader) {
    this.referenceCount = 1;
    this.resourceLoader = resourceLoader;
  }
}

/**
 * @public
 */
namespace ResourceCache {
  export const cacheEntries: {
    [cacheKey: string]: CacheEntry,
  } = {};

  export const statistics = new ResourceCacheStatistics();

  export function get(cacheKey: string) : ResourceLoader | undefined {
    const cacheEntry = ResourceCache.cacheEntries[cacheKey];
    if (defined(cacheEntry)) {
      ++cacheEntry.referenceCount;
      return cacheEntry.resourceLoader;
    }

    return undefined;
  }

  /**
   * Loads a resource and adds it to the cache.
   */
  export function load(options: {
    resourceLoader: ResourceLoader,
  }) {
    const resourceLoader = options.resourceLoader;
    const cacheKey = resourceLoader.cacheKey;

    ResourceCache.cacheEntries[cacheKey] = new CacheEntry(resourceLoader);

    resourceLoader.load();
  }

  export function unload(resourceLoader: ResourceLoader) {
    const cacheKey = resourceLoader.cacheKey;
    const cacheEntry =  ResourceCache.cacheEntries[cacheKey];
    --cacheEntry.referenceCount;

    if (cacheEntry.referenceCount === 0) {
      ResourceCache.statistics.removeLoader(resourceLoader);
      resourceLoader.destroy();
      delete ResourceCache.cacheEntries[cacheKey];
    }
  }

  export function loadGltfJson(options: {
    gltfResource: Resource,
    baseResource: Resource,
    typedArray?,
    gltfJson?,
  }) : GltfJsonLoader {
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;
    const typedArray = options.typedArray;
    const gltfJson = options.gltfJson;

    const cacheKey = ResourceCacheKey.getGltfCacheKey({ gltfResource: gltfResource });

    let gltfJsonLoader = get(cacheKey) as GltfJsonLoader;
    if (defined(gltfJsonLoader)) {
      return gltfJsonLoader;
    }

    gltfJsonLoader = new GltfJsonLoader({
      resourceCache: ResourceCache,
      gltfResource,
      baseResource,
      typedArray,
      gltfJson,
      cacheKey
    });

    load({ resourceLoader: gltfJsonLoader });

    return gltfJsonLoader;
  }

  export function loadVertexBuffer(options: {
    gltf: glTF
    gltfResource: Resource,
    baseResource: Resource,
    bufferViewIndex: number,
    accessorIndex: number,
    draco: KHRDracoMeshCompressionExtension,
    attributeSemantic: string,
    frameState: FrameState,
    asynchronous?: boolean,
    loadBuffer?: boolean,
    loadTypedArray?: boolean,
    // dequantize
  }) : GltfVertexBufferLoader {
    const gltf = options.gltf;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;
    const frameState = options.frameState;
    const bufferViewIndex = options.bufferViewIndex;
    const draco = options.draco;
    const attributeSemantic = options.attributeSemantic;
    const accessorIndex = options.accessorIndex;
    const asynchronous = defaultValue(options.asynchronous, true);
    // const dequantize = defaultValue(options.dequantize, false);
    const loadBuffer = defaultValue(options.loadBuffer, false);
    const loadTypedArray = defaultValue(options.loadTypedArray, false);

    const hasBufferViewIndex = defined(bufferViewIndex);
    const hasDraco = defined(draco) && defined(draco.attributes) && defined(draco.attributes[attributeSemantic]);
    const hasAttributeSemantic = defined(attributeSemantic);
    const hasAccessorIndex = defined(accessorIndex);

    if (hasBufferViewIndex === hasDraco) {
      throw new DeveloperError('One of options.bufferViewId and options.draco must be defined.');
    }

    if (hasDraco && !hasAttributeSemantic) {
      throw new DeveloperError('When options.draco is defined options.attributeSemantic must also be defined.');
    }

    if (hasDraco && !hasAccessorIndex) {
      throw new DeveloperError('When options.draco is defined options.haAccessorId must also be defined.');
    }

    const cacheKey = ResourceCacheKey.getVertexBufferCacheKey({
      gltf: gltf,
      gltfResource: gltfResource,
      baseResource: baseResource,
      frameState: frameState,
      bufferViewIndex: bufferViewIndex,
      draco: draco,
      attributeSemantic: attributeSemantic,
      // dequantize
      loadBuffer: loadBuffer,
      loadTypedArray: loadTypedArray,
    });

    let vertexBufferLoader = ResourceCache.get(cacheKey) as GltfVertexBufferLoader;
    if (defined(vertexBufferLoader)) {
      return vertexBufferLoader;
    }

    vertexBufferLoader = new GltfVertexBufferLoader({
      resourceCache: ResourceCache,
      gltf: gltf,
      gltfResource: gltfResource,
      baseResource: baseResource,
      bufferViewIndex: bufferViewIndex,
      draco: draco,
      attributeSemantic: attributeSemantic,
      accessorIndex: accessorIndex,
      cacheKey: cacheKey,
      asynchronous: asynchronous,
      // dequantize
      loadBuffer: loadBuffer,
      loadTypedArray: loadTypedArray,
    });

    ResourceCache.load({
      resourceLoader: vertexBufferLoader,
    });

    ResourceCache.statistics.addGeometryLoader(vertexBufferLoader);

    return vertexBufferLoader;
  }

  export function loadIndexBuffer(options: {
    gltf: glTF,
    accessorIndex: number,
    gltfResource: Resource,
    baseResource: Resource,
    frameState: FrameState,
    draco: KHRDracoMeshCompressionExtension,
    asynchronous?: boolean,
    loadBuffer?: boolean
    loadTypedArray?: boolean
  }) : GltfIndexBufferLoader {
    const gltf = options.gltf;
    const accessorIndex = options.accessorIndex;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;
    const frameState = options.frameState;
    const draco = options.draco;
    const asynchronous = defaultValue(options.asynchronous, true);
    const loadBuffer = defaultValue(options.loadBuffer, false);
    const loadTypedArray = defaultValue(options.loadTypedArray, false);

    const cacheKey = ResourceCacheKey.getIndexBufferCacheKey({
      gltf: gltf,
      accessorIndex: accessorIndex,
      gltfResource: gltfResource,
      baseResource: baseResource,
      frameState: frameState,
      draco: draco,
      loadBuffer: loadBuffer,
      loadTypedArray: loadTypedArray,
    });

    let indexBufferLoader = ResourceCache.get(cacheKey) as GltfIndexBufferLoader;
    if (defined(indexBufferLoader)) {
      return indexBufferLoader;
    }

    indexBufferLoader = new GltfIndexBufferLoader({
      resourceCache: ResourceCache,
      gltf: gltf,
      accessorIndex: accessorIndex,
      gltfResource: gltfResource,
      baseResource: baseResource,
      draco: draco,
      cacheKey: cacheKey,
      asynchronous: asynchronous,
      loadBuffer: loadBuffer,
      loadTypedArray: loadTypedArray,
    });

    ResourceCache.load({
      resourceLoader: indexBufferLoader,
    });

    statistics.addGeometryLoader(indexBufferLoader);

    return indexBufferLoader;
  }

  export function loadBufferView(options: {
    gltf: glTF,
    bufferViewIndex: number,
    gltfResource: Resource,
    baseResource: Resource,
  }) : GltfBufferViewLoader {
    const gltf = options.gltf;
    const bufferViewIndex = options.bufferViewIndex;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;

    const cacheKey = ResourceCacheKey.getBufferViewCacheKey({
      gltf,
      bufferViewIndex,
      gltfResource,
      baseResource
    });

    let bufferViewLoader = ResourceCache.get(cacheKey) as GltfBufferViewLoader;
    if (defined(bufferViewLoader)) {
      return bufferViewLoader;
    }

    bufferViewLoader = new GltfBufferViewLoader({
      resourceCache: ResourceCache,
      gltf: gltf,
      bufferViewIndex: bufferViewIndex,
      gltfResource: gltfResource,
      baseResource: baseResource,
      cacheKey: cacheKey,
    });

    ResourceCache.load({
      resourceLoader: bufferViewLoader,
    });

    return bufferViewLoader;
  }

  export function loadEmbeddedBuffer(options: {
    parentResource: Resource,
    bufferIndex: number,
    typedArray?: Uint8Array,
  }) : BufferLoader {
    const parentResource = options.parentResource;
    const bufferIndex = options.bufferIndex;
    const typedArray = options.typedArray;

    const cacheKey = ResourceCacheKey.getEmbeddedBufferCacheKey({
      parentResource: parentResource,
      bufferIndex: bufferIndex
    });

    let bufferLoader = ResourceCache.get(cacheKey) as BufferLoader;
    if (defined(bufferLoader)) {
      return bufferLoader;
    }

    if (!defined(typedArray)) {
      throw new RuntimeError('');
    }

    bufferLoader = new BufferLoader({
      typedArray: typedArray,
      cacheKey: cacheKey,
    });

    ResourceCache.load({
      resourceLoader: bufferLoader,
    });

    return bufferLoader;
  }

  export function loadExternalBuffer(options: {
    resource: Resource
  }) : BufferLoader {
    const resource = options.resource;

    const cacheKey = ResourceCacheKey.getExternalBufferCacheKey({
      resource: resource,
    });

    let bufferLoader = ResourceCache.get(cacheKey) as BufferLoader;
    if (defined(bufferLoader)) {
      return bufferLoader;
    }

    bufferLoader = new BufferLoader({
      resource: resource,
      cacheKey: cacheKey,
    });

    ResourceCache.load({
      resourceLoader: bufferLoader,
    });

    return bufferLoader;
  }

  export function loadImage(options: {
    gltf: glTF,
    imageIndex: number,
    gltfResource: Resource,
    baseResource: Resource,
  }) : GltfImageLoader {
    const gltf = options.gltf;
    const imageIndex = options.imageIndex;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;

    const cacheKey = ResourceCacheKey.getImageCacheKey({
      gltf: gltf,
      imageIndex: imageIndex,
      gltfResource: gltfResource,
      baseResource: baseResource,
    });

    let imageLoader = ResourceCache.get(cacheKey) as GltfImageLoader;
    if (defined(imageLoader)) {
      return imageLoader;
    }

    imageLoader = new GltfImageLoader({
      resourceCache: ResourceCache,
      gltf: gltf,
      imageIndex: imageIndex,
      gltfResource: gltfResource,
      baseResource: baseResource,
      cacheKey: cacheKey,
    });

    ResourceCache.load({
      resourceLoader: imageLoader,
    });

    return imageLoader;
  }

  export function loadTexture(options: {
    gltf: glTF,
    textureInfo: TextureInfo,
    gltfResource: Resource,
    baseResource: Resource,
    supportedImageFormats: SupportedImageFormats,
    frameState: FrameState,
    asynchronous?: boolean
  }) : GltfTextureLoader {
    const gltf = options.gltf;
    const textureInfo = options.textureInfo;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;
    const supportedImageFormats = options.supportedImageFormats;
    const frameState = options.frameState;
    const asynchronous = defaultValue(options.asynchronous, true);

    const cacheKey = ResourceCacheKey.getTextureCacheKey({
      gltf: gltf,
      textureInfo: textureInfo,
      gltfResource: gltfResource,
      baseResource: baseResource,
      supportedImageFormats: supportedImageFormats,
      frameState: frameState,
    });

    let textureLoader = ResourceCache.get(cacheKey) as GltfTextureLoader;
    if (defined(textureLoader)) {
      return textureLoader;
    }

    textureLoader = new GltfTextureLoader({
      resourceCache: ResourceCache,
      gltf: gltf,
      textureInfo: textureInfo,
      gltfResource: gltfResource,
      baseResource: baseResource,
      supportedImageFormats: supportedImageFormats,
      cacheKey: cacheKey,
      asynchronous: asynchronous,
    });

    ResourceCache.load({
      resourceLoader: textureLoader,
    });

    statistics.addTextureLoader(textureLoader);

    return textureLoader;
  }
}

export default ResourceCache;
