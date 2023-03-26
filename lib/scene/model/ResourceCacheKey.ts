import Resource from "../../core/Resource";
import defaultValue from "../../core/defaultValue";
import defined from "../../core/defined";
import getAbsoluteUri from "../../core/getAbsoluteUri";
import FrameState from "../FrameState";
import GltfLoaderUtil from "./GltfLoaderUtil";
import SupportedImageFormats from "./SupportedImageFormats";
import hasExtension from "./hasExtension";
import { glTF, Buffer, BufferView, Accessor, TextureInfo, KHRDracoMeshCompressionExtension } from "./glTF";

class ResourceCacheKey {
  static getGltfCacheKey(options: {
    gltfResource: Resource
  }) {
    return `gltf:${getExternalResourceCacheKey(options.gltfResource)}`;
  }

  static getVertexBufferCacheKey(options: {
    gltf: glTF,
    gltfResource: Resource,
    baseResource: Resource,
    frameState: FrameState,
    bufferViewIndex: number,
    draco: KHRDracoMeshCompressionExtension,
    attributeSemantic: string,
    // dequantize
    loadBuffer?: boolean,
    loadTypedArray?: boolean,
  }) : string {
    const gltf = options.gltf;
    const bufferViewIndex = options.bufferViewIndex;
    const loadBuffer = defaultValue(options.loadBuffer, false);
    const loadTypedArray = defaultValue(options.loadTypedArray, false);

    let cacheKeySuffix = '';

    if (loadBuffer) {
      cacheKeySuffix += `-buffer-context-${options.frameState.context.id}`;
    }

    if (loadTypedArray) {
      cacheKeySuffix += '-typed-array';
    }

    if (defined(options.draco)) {
      throw new Error("getVertexBufferCacheKey: To be implemented");
    }

    const bufferView = gltf.bufferViews[bufferViewIndex];
    const bufferIndex = bufferView.buffer;
    const buffer = gltf.buffers[bufferIndex];

    const bufferCacheKey = getBufferCacheKey(
      buffer,
      bufferIndex,
      options.gltfResource,
      options.baseResource,
    );
    const bufferViewCacheKey = getBufferViewCacheKey(bufferView);

    return `vertex-buffer:${bufferCacheKey}-range-${bufferViewCacheKey}${cacheKeySuffix}`;
  }

  static getBufferViewCacheKey(options: {
    gltf: glTF,
    bufferViewIndex: number,
    gltfResource: Resource,
    baseResource: Resource,
  }) : string {
    const gltf = options.gltf;
    const bufferViewIndex = options.bufferViewIndex;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;

    const bufferView = gltf.bufferViews[bufferViewIndex];
    let bufferIndex = bufferView.buffer;
    const buffer = gltf.buffers[bufferIndex];
    if (hasExtension(bufferView, "EXT_meshopt_compression")) {
      const meshopt = bufferView.extensions.EXT_meshopt_compression;
      bufferIndex = meshopt.buffer;
    }

    const bufferCacheKey = getBufferCacheKey(
      buffer,
      bufferIndex,
      gltfResource,
      baseResource
    );
    const bufferViewCacheKey = getBufferViewCacheKey(bufferView);

    return `buffer-view:${bufferCacheKey}-range-${bufferViewCacheKey}`;
  }

  static getEmbeddedBufferCacheKey(options: {
    parentResource: Resource,
    bufferIndex: number,
  }) : string {
    const parentResource = options.parentResource;
    const bufferIndex = options.bufferIndex;

    return `embedded-buffer:${getEmbeddedBufferCacheKey(parentResource, bufferIndex)}`;
  }

  static getExternalBufferCacheKey(options: {
    resource: Resource
  }) : string {
    const resource = options.resource;

    return `external-buffer:${getExternalBufferCacheKey(resource)}`;
  }

  static getIndexBufferCacheKey(options: {
    gltf: glTF,
    accessorIndex: number,
    gltfResource: Resource,
    baseResource: Resource,
    frameState: FrameState,
    draco: KHRDracoMeshCompressionExtension,
    loadBuffer: boolean,
    loadTypedArray: boolean,
  }) : string {
    const gltf = options.gltf;
    const accessorIndex = options.accessorIndex;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;
    const frameState = options.frameState;
    const draco = options.draco;
    const loadBuffer = defaultValue(options.loadBuffer, false);
    const loadTypedArray = defaultValue(options.loadTypedArray, false);

    let cacheKeySuffix = '';
    if (loadBuffer) {
      cacheKeySuffix += `-buffer-context-${frameState.context.id}`;
    }

    if (loadTypedArray) {
      cacheKeySuffix += '-typed-array';
    }

    if (defined(draco)) {
      throw new Error("getIndexBufferCacheKey: To be implemented");
    }

    const accessor = gltf.accessors[accessorIndex];
    const bufferViewIndex = accessor.bufferView;
    const bufferView = gltf.bufferViews[bufferViewIndex];
    const bufferIndex = bufferView.buffer;
    const buffer = gltf.buffers[bufferIndex];

    const bufferCacheKey = getBufferCacheKey(
      buffer,
      bufferIndex,
      gltfResource,
      baseResource
    );

    const accessorCacheKey = getAccessorCacheKey(accessor, bufferView);

    return `index-buffer:${bufferCacheKey}-accessor-${accessorCacheKey}${cacheKeySuffix}`;
  }

  static getTextureCacheKey(options: {
    gltf,
    textureInfo,
    gltfResource: Resource,
    baseResource: Resource,
    supportedImageFormats: SupportedImageFormats,
    frameState: FrameState
  }) : string {
    const gltf = options.gltf;
    const textureInfo = options.textureInfo;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;
    const supportedImageFormats = options.supportedImageFormats;
    const frameState = options.frameState;

    const textureIndex = textureInfo.index;

    const imageIndex = GltfLoaderUtil.getImageIndexFromTexture({
      gltf,
      textureIndex,
      supportedImageFormats
    });

    const imageCacheKey = getImageCacheKey(gltf, imageIndex, gltfResource, baseResource);

    // Include the sampler cache key in the texture cache key since textures and
    // samplers are coupled in WebGL 1. When upgrading to WebGL 2 consider
    // removing the sampleCacheKey here.
    const samplerCacheKey = getSamplerCacheKey(gltf, textureInfo);

    return `texture:${imageCacheKey}-sampler-${samplerCacheKey}-context-${frameState.context.id}`;
  }

  static getImageCacheKey(options: {
    gltf: glTF,
    imageIndex: number,
    gltfResource: Resource,
    baseResource: Resource,
  }) : string {
    const gltf = options.gltf;
    const imageIndex = options.imageIndex;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;

    const imageCacheKey = getImageCacheKey(gltf, imageIndex, gltfResource, baseResource);

    return `image:${imageCacheKey}`;
  }
}

function getBufferCacheKey(
  buffer: Buffer,
  bufferIndex: number,
  gltfResource: Resource,
  baseResource: Resource
) {
  if (defined(buffer.uri)) {
    const resource = baseResource.getDerivedResource({
      url: buffer.uri,
    });
    return getExternalBufferCacheKey(resource);
  }

  return getEmbeddedBufferCacheKey(gltfResource, bufferIndex);
}

function getBufferViewCacheKey(bufferView: BufferView) {
  let byteOffset = bufferView.byteOffset;
  let byteLength = bufferView.byteLength;

  if (hasExtension(bufferView, 'EXT_meshopt_compression')) {
    const meshopt = bufferView.extensions.EXT_meshopt_compression;
    byteOffset = defaultValue(meshopt.byteOffset, 0);
    byteLength = meshopt.byteLength;
  }

  return `${byteOffset}-${byteOffset + byteLength}`;
}

function getAccessorCacheKey(accessor: Accessor, bufferView: BufferView) {
  const byteOffset = bufferView.byteOffset + accessor.byteOffset;
  const componentType = accessor.componentType;
  const type = accessor.type;
  const count = accessor.count;
  return `${byteOffset}-${componentType}-${type}-${count}`;
}

function getExternalResourceCacheKey(resource: Resource) {
  return getAbsoluteUri(resource.url);
}

function getExternalBufferCacheKey(resource: Resource): string {
  return getExternalResourceCacheKey(resource);
}

function getEmbeddedBufferCacheKey(gltfResource: Resource, bufferIndex: number): string {
  const parentCacheKey = getExternalResourceCacheKey(gltfResource);
  return `${parentCacheKey}-buffer-id-${bufferIndex}`;
}

function getImageCacheKey(gltf, imageIndex: number, gltfResource: Resource, baseResource: Resource) {
  const image = gltf.images[imageIndex];
  const bufferViewId = image.bufferView;
  const uri = image.uri;

  if (defined(uri)) {
    const resource = baseResource.getDerivedResource({
      url: uri,
    });
    return getExternalResourceCacheKey(resource);
  }

  const bufferView = gltf.bufferViews[bufferViewId];
  const bufferIndex = bufferView.buffer;
  const buffer = gltf.buffers[bufferIndex];

  const bufferCacheKey = getBufferCacheKey(buffer, bufferIndex, gltfResource, baseResource);
  const bufferViewCacheKey = getBufferViewCacheKey(bufferView);

  return `${bufferCacheKey}-range-${bufferViewCacheKey}`;
}

function getSamplerCacheKey(gltf: glTF, textureInfo: TextureInfo) {
  const sampler = GltfLoaderUtil.createSampler({
    gltf: gltf,
    textureInfo: textureInfo,
  });

  return `${sampler.wrapS}-${sampler.wrapT}-${sampler.minificationFilter}-${sampler.magnificationFilter}`;
}

export default ResourceCacheKey;
