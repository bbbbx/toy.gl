import Resource from "../../../core/Resource";
import defaultValue from "../../../core/defaultValue";
import defined from "../../../core/defined";
import Cartesian3 from "../../../math/Cartesian3";
import Cartesian4 from "../../../math/Cartesian4";
import Matrix4 from "../../../math/Matrix4";
import Quaternion from "../../../math/Quaternion";
import * as ModelComponents from "../ModelComponents";
import GltfTextureLoader from "./GltfTextureLoader";
import ResourceLoader from "./ResourceLoader";
import ResourceLoaderState from "./ResourceLoaderState";
import Cartesian2 from "../../../math/Cartesian2";
import Matrix3 from "../../../math/Matrix3";
import Texture from "../../../renderer/Texture";
import VertexAttributeSemantic from "../VertexAttributeSemantic";
import PrimitiveLoadPlan from "../PrimitiveLoadPlan";
import AttributeType from "../AttributeType";
import Matrix2 from "../../../math/Matrix2";
import DeveloperError from "../../../core/DeveloperError";
import getAccessorByteStride from "../getAccessorByteStride";
import GltfVertexBufferLoader from "./GltfVertexBufferLoader";
import GltfIndexBufferLoader from "./GltfIndexBufferLoader";
import GltfBufferViewLoader from "./GltfBufferViewLoader";
import getComponentDatatypeSizeInBytes from "../../../core/getComponentDatatypeSizeInBytes";
import numberOfComponentsForType from "../numberOfComponentsForType";
import createTypedArray from "../../../core/createTypedArray";
import getSizeInBytes from "../../../core/getSizeInBytes";
import ComponentDatatype from "../../../core/ComponentDatatype";
import getComponentReader from "../getComponentReader";
import GltfJsonLoader from "./GltfJsonLoader";
import FrameState from "../../FrameState";
import ResourceCache from "../ResourceCache";
import { Accessor, Material, Node, Primitive, TextureInfo, glTF, KHRDracoMeshCompressionExtension } from "../glTF";
import SupportedImageFormats from "../SupportedImageFormats";
import AlphaMode from "../AlphaMode";
import GltfLoaderUtil from "../GltfLoaderUtil";
import Sampler from "../../../renderer/Sampler";
import Buffer from "../../../renderer/Buffer";
import Context from "../../../renderer/Context";
import getNumberOfComponentsFromAttributeType from "../../getNumberOfComponentsFromAttributeType";

/**
 * Get a texture loader to load the texture and assign to the returned texture reader.
 * @internal
 * @param loader 
 * @param gltf 
 * @param textureInfo 
 * @param supportedImageFormats 
 * @param frameState 
 * @param samplerOverride 
 * @returns 
 */
function loadTexture(
  loader: GltfLoader,
  gltf: glTF,
  textureInfo: TextureInfo,
  supportedImageFormats: SupportedImageFormats,
  frameState: FrameState,
  samplerOverride?: Sampler
) {
  const imageIndex = GltfLoaderUtil.getImageIndexFromTexture({
    gltf: gltf,
    textureIndex: textureInfo.index,
    supportedImageFormats: supportedImageFormats,
  });

  if (!defined(imageIndex)) {
    return undefined;
  }

  const textureLoader = ResourceCache.loadTexture({
    gltf: gltf,
    textureInfo: textureInfo,
    gltfResource: loader._gltfResource,
    baseResource: loader._baseResource,
    supportedImageFormats: supportedImageFormats,
    frameState: frameState,
    asynchronous: loader._asynchronous,
  });

  loader._textureLoaders.push(textureLoader);

  const textureReader = GltfLoaderUtil.createModelTextureReader({
    textureInfo: textureInfo,
  });

  const promise = textureLoader.promise.then(function (textureLoader) {
    if (loader.isUnloaded() || loader.isDestroyed()) {
      return;
    }

    textureReader.texture = textureLoader.texture;
    if (defined(samplerOverride)) {
      textureReader.texture.sampler = samplerOverride;
    }
  });

  loader._texturesPromises.push(promise);

  return textureReader;
}

function loadInstances(loader: GltfLoader, gltf: glTF, nodeExtensions, frameState: FrameState) {
  const instances = new ModelComponents.Instances();

  // return instances;
  throw new Error("loadInstances: To be implemented");
}

function loadMaterial(
  loader: GltfLoader,
  gltf: glTF,
  gltfMaterial: Material,
  supportedImageFormats: SupportedImageFormats,
  frameState: FrameState
) {
  const material = new ModelComponents.Material();

  const pbrMetallicRoughness = gltfMaterial.pbrMetallicRoughness;
  const extensions = defaultValue(gltfMaterial.extensions, defaultValue.EMPTY_OBJECT);
  const pbrSpecularGlossinessExtension = extensions.KHR_materials_pbrSpecularGlossiness;
  const specularExtension = extensions.KHR_materials_specular;
  const clearcoatExtension = extensions.KHR_materials_clearcoat;
  const emissiveStrengthExtension = extensions.KHR_materials_emissive_strength;

  if (defined(emissiveStrengthExtension)) {
    material.emissiveStrength = new ModelComponents.EmissiveStrength();
    if (defined(emissiveStrengthExtension.emissiveStrength)) {
      material.emissiveStrength.emissiveStrength = emissiveStrengthExtension.emissiveStrength;
    }
  }

  // KHR_materials_specular extension
  if (defined(specularExtension)) {
    material.specular = new ModelComponents.Specular();

    if (defined(specularExtension.specularFactor)) {
      material.specular.specularFactor = specularExtension.specularFactor;
    }
    if (defined(specularExtension.specularTexture)) {
      material.specular.specularTexture = loadTexture(loader, gltf, specularExtension.specularTexture, supportedImageFormats, frameState);
    }
    if (defined(specularExtension.specularColorFactor)) {
      material.specular.specularColorFactor = Cartesian3.unpack(specularExtension.specularColorFactor);
    }
    if (defined(specularExtension.specularColorTexture)) {
      material.specular.specularColorTexture = loadTexture(loader, gltf, specularExtension.specularColorTexture, supportedImageFormats, frameState);
    }
  }

  // KHR_materials_clearcoat extension
  if (defined(clearcoatExtension)) {
    material.clearcoat = new ModelComponents.Clearcoat();

    if (defined(clearcoatExtension.clearcoatFactor)) {
      material.clearcoat.clearcoatFactor = clearcoatExtension.clearcoatFactor;
    }
    if (defined(clearcoatExtension.clearcoatTexture)) {
      material.clearcoat.clearcoatTexture = loadTexture(loader, gltf, clearcoatExtension.clearcoatTexture, supportedImageFormats, frameState);
    }
    if (defined(clearcoatExtension.clearcoatRoughnessFactor)) {
      material.clearcoat.clearcoatRoughnessFactor = clearcoatExtension.clearcoatRoughnessFactor;
    }
    if (defined(clearcoatExtension.clearcoatRoughnessTexture)) {
      material.clearcoat.clearcoatRoughnessTexture = loadTexture(loader, gltf, clearcoatExtension.clearcoatRoughnessTexture, supportedImageFormats, frameState);
    }
    if (defined(clearcoatExtension.clearcoatNormalTexture)) {
      material.clearcoat.clearcoatNormalTexture = loadTexture(loader, gltf, clearcoatExtension.clearcoatNormalTexture, supportedImageFormats, frameState);
    }
  }


  if (defined(pbrMetallicRoughness)) {
    const metallicRoughness = new ModelComponents.MetallicRoughness();

    if (defined(pbrMetallicRoughness.baseColorTexture)) {
      metallicRoughness.baseColorTexture = loadTexture(loader, gltf, pbrMetallicRoughness.baseColorTexture, supportedImageFormats, frameState);
    }
    if (defined(pbrMetallicRoughness.metallicRoughnessTexture)) {
      metallicRoughness.metallicRoughnessTexture = loadTexture(loader, gltf, pbrMetallicRoughness.metallicRoughnessTexture, supportedImageFormats, frameState);
    }
    if (defined(pbrMetallicRoughness.baseColorFactor)) {
      metallicRoughness.baseColorFactor = Cartesian4.unpack(pbrMetallicRoughness.baseColorFactor);
    }
    if (defined(pbrMetallicRoughness.metallicFactor)) {
      metallicRoughness.metallicFactor = pbrMetallicRoughness.metallicFactor;
    }
    if (defined(pbrMetallicRoughness.roughnessFactor)) {
      metallicRoughness.roughnessFactor = pbrMetallicRoughness.roughnessFactor;
    }

    material.metallicRoughness = metallicRoughness;
  }

  if (defined(gltfMaterial.normalTexture)) {
    material.normalTexture = loadTexture(loader, gltf, gltfMaterial.normalTexture, supportedImageFormats, frameState);
  }
  if (defined(gltfMaterial.occlusionTexture)) {
    material.occlusionTexture = loadTexture(loader, gltf, gltfMaterial.occlusionTexture, supportedImageFormats, frameState);
  }
  if (defined(gltfMaterial.emissiveTexture)) {
    material.emissiveTexture = loadTexture(loader, gltf, gltfMaterial.emissiveTexture, supportedImageFormats, frameState);
  }
  if (defined(gltfMaterial.emissiveFactor)) {
    material.emissiveFactor = Cartesian3.unpack(gltfMaterial.emissiveFactor);
  }
  if (defined(gltfMaterial.alphaMode)) {
    material.alphaMode = gltfMaterial.alphaMode as AlphaMode;
  }
  if (defined(gltfMaterial.alphaCutoff)) {
    material.alphaCutoff = gltfMaterial.alphaCutoff;
  }
  if (defined(gltfMaterial.doubleSided)) {
    material.doubleSided = gltfMaterial.doubleSided;
  }

  return material;
}

const scratchSemanticInfo = {
  gltfSemantic: '',
  renamedSemantic: '',
  modelSemantic: '' as VertexAttributeSemantic,
};

function fromGltfSemantic(gltfSemantic: string) : VertexAttributeSemantic {
  let modelSemantic = gltfSemantic;
  const setIndexMatch = /^(\w+)_\d+$/.exec(gltfSemantic);
  if (setIndexMatch) {
    modelSemantic = setIndexMatch[1];
  }
  return modelSemantic as VertexAttributeSemantic;
}
function getSemanticInfo(loader: GltfLoader, semanticType, gltfSemantic: string) {
  // For .b3dm, rename _BATCHID (or the legacy BATCHID) to _FEATURE_ID_0
  // in the generated model components for compatibility with EXT_mesh_features
  let renamedSemantic = gltfSemantic;
  if (
    loader._renameBatchIdSemantic &&
    (gltfSemantic === '_BATCHID' || gltfSemantic === 'BATCHID')
  ) {
    renamedSemantic = '_FEATURE_ID_0';
  }

  const modelSemantic = fromGltfSemantic(renamedSemantic)

  const semanticInfo = scratchSemanticInfo;
  semanticInfo.gltfSemantic = gltfSemantic;
  semanticInfo.renamedSemantic = renamedSemantic;
  semanticInfo.modelSemantic = modelSemantic;
  return semanticInfo
}

function getSetIndex(gltfSemantic: string) {
  const setIndexRegex = /^\w+_(\d+)$/;
  const setIndexMatch = setIndexRegex.exec(gltfSemantic);
  if (setIndexMatch !== null) {
    return parseInt(setIndexMatch[1]);
  }
  return undefined;
}

function getMathType(attributeType: AttributeType) {
  switch (attributeType) {
    case AttributeType.SCALAR:
      return Number;
    case AttributeType.VEC2:
      return Cartesian2;
    case AttributeType.VEC3:
      return Cartesian3;
    case AttributeType.VEC4:
      return Cartesian4;
    case AttributeType.MAT2:
      return Matrix2;
    case AttributeType.MAT3:
      return Matrix3;
    case AttributeType.MAT4:
      return Matrix4;
    default:
      throw new DeveloperError('attributeType is not a valid value.');
  }
}

function getDefault(MathType) {
  if (MathType === Number) {
    return 0.0;
  }

  return new MathType(); // defaults to 0.0 for all types
}

function fromArray(
  MathType: typeof Number | typeof Cartesian2 | typeof Cartesian3 | typeof Cartesian4 | typeof Matrix2 | typeof Matrix3 | typeof Matrix4,
  values?: ArrayLike<number>
) : undefined | number | Cartesian2 | Cartesian3 | Cartesian4 | Matrix2 | Matrix3 | Matrix4 {
  if (!defined(values)) {
    return undefined;
  }

  if (MathType === Number) {
    return values[0];
  }

  return (MathType as typeof Cartesian2 | typeof Cartesian3 | typeof Cartesian4 | typeof Matrix2 | typeof Matrix3 | typeof Matrix4).unpack(values);
}

function createAttribute(
  gltf: glTF,
  accessorIndex: number,
  name: string,
  semantic: VertexAttributeSemantic,
  setIndex: number,
) {
  const accessor = gltf.accessors[accessorIndex];
  const MathType = getMathType(accessor.type as AttributeType);
  const normalized = defaultValue(accessor.normalized, false);

  const attribute = new ModelComponents.Attribute();
  attribute.name = name;
  attribute.semantic = semantic;
  attribute.setIndex = setIndex;
  attribute.constant = getDefault(MathType);
  attribute.componentDatatype = accessor.componentType;
  attribute.normalized = normalized;
  attribute.count = accessor.count;
  attribute.type = accessor.type as AttributeType;
  attribute.min = fromArray(MathType, accessor.min);
  attribute.max = fromArray(MathType, accessor.max);
  attribute.byteOffset = accessor.byteOffset;
  attribute.byteStride = getAccessorByteStride(gltf, accessor);

  return attribute;
}

function loadVertexBuffer(
  loader: GltfLoader,
  gltf: glTF,
  accessorIndex: number,
  semantic: string,
  draco: KHRDracoMeshCompressionExtension,
  loadBuffer: boolean,
  loadTypedArray: boolean,
  frameState: FrameState
) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferViewIndex = accessor.bufferView;

  const vertexBufferLoader = ResourceCache.loadVertexBuffer({
    gltf: gltf,
    gltfResource: loader._gltfResource,
    baseResource: loader._baseResource,
    bufferViewIndex: bufferViewIndex,
    draco: draco,
    attributeSemantic: semantic,
    accessorIndex: accessorIndex,
    loadBuffer: loadBuffer,
    loadTypedArray: loadTypedArray,
    asynchronous: loader._asynchronous,
    frameState: frameState,
  });

  loader._geometryLoaders.push(vertexBufferLoader);

  return vertexBufferLoader;
}

function createArrayBufferView(
  componentDatatype: ComponentDatatype,
  buffer: ArrayBuffer,
  byteOffset: number = 0,
  length: number = (buffer.byteLength - byteOffset) / getComponentDatatypeSizeInBytes(componentDatatype)
) {
  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return new Int8Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_BYTE:
      return new Uint8Array(buffer, byteOffset, length);
    case ComponentDatatype.SHORT:
      return new Int16Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_SHORT:
      return new Uint16Array(buffer, byteOffset, length);
    case ComponentDatatype.INT:
      return new Int32Array(buffer, byteOffset, length);
    case ComponentDatatype.UNSIGNED_INT:
      return new Uint32Array(buffer, byteOffset, length);
    case ComponentDatatype.FLOAT:
      return new Float32Array(buffer, byteOffset, length);
    case ComponentDatatype.DOUBLE:
      return new Float64Array(buffer, byteOffset, length);
    default:
      throw new DeveloperError('componentDatatype is not a valid value.');
  }
}

function createTypedArrayFromComponentDatatype(
  componentDatatype: ComponentDatatype,
  valuesOrLength: number | ArrayLike<number> | ArrayBufferLike
) {
  switch (componentDatatype) {
    case ComponentDatatype.BYTE:
      return new Int8Array(valuesOrLength as number);
    case ComponentDatatype.UNSIGNED_BYTE:
      return new Uint8Array(valuesOrLength as number);
    case ComponentDatatype.SHORT:
      return new Int16Array(valuesOrLength as number);
    case ComponentDatatype.UNSIGNED_SHORT:
      return new Uint16Array(valuesOrLength as number);
    case ComponentDatatype.INT:
      return new Int32Array(valuesOrLength as number);
    case ComponentDatatype.UNSIGNED_INT:
      return new Uint32Array(valuesOrLength as number);
    case ComponentDatatype.FLOAT:
      return new Float32Array(valuesOrLength as number);
    case ComponentDatatype.DOUBLE:
      return new Float64Array(valuesOrLength as number);
    default:
      throw new DeveloperError('componentDatatype is not a valid value.');
  }
}
function getPackedTypedArray(gltf, accessor, bufferViewTypedArray: Uint8Array) {
  let byteOffset = accessor.byteOffset;
  const byteStride = getAccessorByteStride(gltf, accessor);
  const count : number = accessor.count;
  const componentCount = numberOfComponentsForType(accessor.type);
  const componentType: ComponentDatatype = accessor.componentType;
  const componentByteLength = getComponentDatatypeSizeInBytes(componentType);
  const defaultByteStride = componentByteLength * componentCount;
  const componentsLength = count * componentCount;

  if (byteStride === defaultByteStride) {
    // Copy the typed array and let the underlying ArrayBuffer be freed
    bufferViewTypedArray = new Uint8Array(bufferViewTypedArray);
    return createArrayBufferView(
      componentType,
      bufferViewTypedArray.buffer,
      bufferViewTypedArray.byteOffset + byteOffset,
      componentsLength
    );
  }

  const accessorTypedArray = createTypedArrayFromComponentDatatype(componentType, componentsLength);

  const dataView = new DataView(bufferViewTypedArray.buffer);
  const components = new Array(componentCount);
  const componentReader = getComponentReader(accessor.componentType);
  byteOffset = bufferViewTypedArray.byteOffset + byteOffset;

  for (let i = 0; i < count; i++) {
    componentReader(
      dataView,
      byteOffset,
      componentCount,
      componentByteLength,
      components
    );

    for (let j = 0; j < componentCount; j++) {
      accessorTypedArray[i * componentCount + j] = components[j];
    }

    byteOffset += byteStride;
  }

  return accessorTypedArray;
}

function finalizeDracoAttribute(
  attribute: ModelComponents.Attribute,
  vertexBufferLoader: GltfVertexBufferLoader,
  loadBuffer: boolean,
  loadTypedArray: boolean,
) {
  throw new Error('finalizeDracoAttribute: To be implemented')
}

/**
 * Assign vertexBufferLoader.buffer to attribute.buffer,
 * and use accessor to pack vertexBufferLoader.typedArray to attribute.typedArray if needed.
 * @internal
 * @param gltf 
 * @param accessor 
 * @param attribute 
 * @param vertexBufferLoader 
 * @param loadBuffer 
 * @param loadTypedArray 
 */
function finalizeAttribute(
  gltf,
  accessor,
  attribute: ModelComponents.Attribute,
  vertexBufferLoader: GltfVertexBufferLoader,
  loadBuffer: boolean,
  loadTypedArray: boolean
) {
  if (loadBuffer) {
    attribute.buffer = vertexBufferLoader.buffer;
  }

  if (loadTypedArray) {
    attribute.typedArray = getPackedTypedArray(gltf, accessor, vertexBufferLoader.typedArray);

    if (!loadBuffer) {
      // If the buffer isn't loaded, then the accessor's byteOffset and
      // byteStride should be ignored, since values are only available in a
      // tightly packed typed array
      attribute.byteOffset = 0;
      attribute.byteStride = undefined;
    }
  }
}

function loadAttribute(
  loader: GltfLoader,
  gltf: glTF,
  accessorIndex: number,
  semanticInfo: SemanticInfo,
  draco: KHRDracoMeshCompressionExtension,
  loadBuffer: boolean,
  loadTypedArray: boolean,
  frameState: FrameState,
) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferViewIndex = accessor.bufferView;

  const gltfSemantic = semanticInfo.gltfSemantic;
  const renamedSemantic = semanticInfo.renamedSemantic;
  const modelSemantic = semanticInfo.modelSemantic;

  const setIndex = defined(modelSemantic)
    ? getSetIndex(renamedSemantic)
    : undefined;

  const name = gltfSemantic;
  const attribute = createAttribute(
    gltf,
    accessorIndex,
    name,
    modelSemantic,
    setIndex,
  );

  if (!defined(draco) && !defined(bufferViewIndex)) {
    return attribute;
  }

  const vertexBufferLoader = loadVertexBuffer(
    loader,
    gltf,
    accessorIndex,
    gltfSemantic,
    draco,
    loadBuffer,
    loadTypedArray,
    frameState
  );

  const promise = vertexBufferLoader.promise.then(function(vertexBufferLoader) {
    if (loader.isDestroyed()) {
      return;
    }

    if (
      defined(draco) &&
      defined(draco.attributes) &&
      defined(draco.attributes[gltfSemantic])
    ) {
      finalizeDracoAttribute(
        attribute,
        vertexBufferLoader,
        loadBuffer,
        loadTypedArray
      );
    } else {
      finalizeAttribute(
        gltf,
        accessor,
        attribute,
        vertexBufferLoader,
        loadBuffer,
        loadTypedArray
      );
    }
  });

  loader._loaderPromises.push(promise);

  return attribute;
}

type SemanticInfo = typeof scratchSemanticInfo;

function loadVertexAttribute(
  loader: GltfLoader,
  gltf: glTF,
  accessorIndex: number,
  semanticInfo: SemanticInfo,
  draco: KHRDracoMeshCompressionExtension,
  hasInstances: boolean,
  needsPostProcessing: boolean,
  frameState: FrameState,
) {
  const outputBuffer = true;
  const outputTypedArray = false;

  // Determine what to load right now:
  // - If post-processing is needed, load a packed typed array for
  //   further processing, and defer the buffer loading until later.
  // - On the other hand, if post-processing is not needed,
  //   set the load flags directly
  const loadBuffer = needsPostProcessing ? true : outputBuffer;
  const loadTypedArray = needsPostProcessing ? true : outputTypedArray;

  const attribute = loadAttribute(
    loader,
    gltf,
    accessorIndex,
    semanticInfo,
    draco,
    loadBuffer,
    loadTypedArray,
    frameState
  );

  const attributePlan = new PrimitiveLoadPlan.AttributeLoadPlan(attribute);
  attributePlan.loadBuffer = outputBuffer;
  attributePlan.loadTypedArray = outputTypedArray;

  return attributePlan;
}

function loadIndices(
  loader: GltfLoader,
  gltf: glTF,
  accessorIndex: number,
  draco: KHRDracoMeshCompressionExtension,
  // hasFeatureIds,
  needsPostProcessing: boolean,
  frameState: FrameState
) {
  const accessor = gltf.accessors[accessorIndex];
  const bufferViewIndex = accessor.bufferView;

  if (!defined(draco) && !defined(bufferViewIndex)) {
    return undefined;
  }

  const indices = new ModelComponents.Indices();
  indices.count = accessor.count;

  const outputBuffer = true;
  const outputTypedArray = false;

  // Determine what to load right now:
  // - If post-processing is needed, load a packed typed array for
  //   further processing, and defer the buffer loading until later.
  // - On the other hand, if post-processing is not needed,
  //   set the load flags directly
  const loadBuffer = needsPostProcessing ? false : outputBuffer;
  const loadTypedArray = needsPostProcessing ? true : outputTypedArray;

  const indexBufferLoader = loadIndexBuffer(
    loader,
    gltf,
    accessorIndex,
    draco,
    loadBuffer,
    loadTypedArray,
    frameState
  );

  const promise = indexBufferLoader.promise.then(function (indexBufferLoader: GltfIndexBufferLoader) {
    if (loader.isDestroyed()) {
      return;
    }

    indices.indexDatatype = indexBufferLoader.indexDatatype;

    indices.buffer = indexBufferLoader.buffer;
    indices.typedArray = indexBufferLoader.typedArray;
  });

  loader._loaderPromises.push(promise);

  const indicesPlan = new PrimitiveLoadPlan.IndicesLoadPlan(indices);
  indicesPlan.loadBuffer = outputBuffer;
  indicesPlan.loadTypedArray = outputTypedArray;

  return indicesPlan;
}

function loadIndexBuffer(
  loader: GltfLoader,
  gltf: glTF,
  accessorIndex: number,
  draco: KHRDracoMeshCompressionExtension,
  loadBuffer: boolean,
  loadTypedArray: boolean,
  frameState: FrameState
) {
  const indexBufferLoader = ResourceCache.loadIndexBuffer({
    gltf: gltf,
    accessorIndex: accessorIndex,
    gltfResource: loader._gltfResource,
    baseResource: loader._baseResource,
    frameState: frameState,
    draco: draco,
    asynchronous: loader._asynchronous,
    loadBuffer: loadBuffer,
    loadTypedArray: loadTypedArray,
  });

  loader._geometryLoaders.push(indexBufferLoader);

  return indexBufferLoader;
}

function loadPrimitiveOutline(
  gltfLoader: GltfLoader,
  gltf: glTF,
  outlineExtension
) : number[] {
  const accessorIndex: number = outlineExtension.indices;
  const useQuaternion = false;
  return loadAccessor(gltfLoader, gltf, accessorIndex, useQuaternion) as number[];
}

type AccessorValues = number[] | Quaternion[] | Cartesian2[] | Cartesian3[] | Cartesian4[] | Matrix2[] | Matrix3[] | Matrix4[];

function loadAccessor(
  gltfLoader: GltfLoader,
  gltf: glTF,
  accessorIndex: number,
  useQuaternion: boolean = false
) : AccessorValues {
  const accessor = gltf.accessors[accessorIndex];
  const accessorCount = accessor.count;
  const values: AccessorValues = new Array(accessorCount);

  const bufferViewIndex = accessor.bufferView;

  if (defined(bufferViewIndex)) {
    const bufferViewLoader = loadBufferView(gltfLoader, gltf, bufferViewIndex);
    const promise = bufferViewLoader.promise.then(function (bufferViewLoader: GltfBufferViewLoader) {
      if (gltfLoader.isDestroyed()) {
        return;
      }

      const bufferViewTypedArray = bufferViewLoader.typedArray;
      const typedArray = getPackedTypedArray(gltf, accessor, bufferViewTypedArray);

      loadAccessorValues(accessor, typedArray, values, useQuaternion);
    });

    gltfLoader._loaderPromises.push(promise);

    return values;
  }

  return loadDefaultAccessorValues(accessor, values);
}

function loadAccessorValues(
  accessor: Accessor,
  typedArray: ArrayLike<number>,
  values: AccessorValues,
  useQuaternion: boolean
) {
  const accessorType = accessor.type as AttributeType;
  const accessorCount = accessor.count;

  if (accessorType === AttributeType.SCALAR) {
    for (let i = 0; i < accessorCount; i++) {
      values[i] = typedArray[i];
    }
  } else if (accessorType === AttributeType.VEC4 && useQuaternion) {
    for (let i = 0; i < accessorCount; i++) {
      values[i] = Quaternion.unpack(typedArray as number[], i * 4);
    }
  } else {
    const MathType = getMathType(accessorType) as Exclude<ReturnType<typeof getMathType>, NumberConstructor>;
    const numberOfComponents = getNumberOfComponentsFromAttributeType(accessorType);

    for (let i = 0; i < accessorCount; i++) {
      values[i] = (MathType).unpack(typedArray, i * numberOfComponents);
    }
  }

  return values;
}

function loadDefaultAccessorValues(accessor: Accessor, values: AccessorValues) : Exclude<AccessorValues, Quaternion[]> {
  const accessorType = accessor.type as AttributeType;
  if (accessorType === AttributeType.SCALAR) {
    return (values as number[]).fill(0);
  }

  const MathType = getMathType(accessorType) as Exclude<ReturnType<typeof getMathType>, NumberConstructor>;
  return values.fill( MathType.clone(MathType.ZERO as any) as any );
}

function loadBufferView(gltfLoader: GltfLoader, gltf: glTF, bufferViewIndex: number) : GltfBufferViewLoader {
  const bufferViewLoader = ResourceCache.loadBufferView({
    gltf: gltf,
    bufferViewIndex: bufferViewIndex,
    gltfResource: gltfLoader._gltfResource,
    baseResource: gltfLoader._baseResource,
  });

  gltfLoader._bufferViewLoaders.push(bufferViewLoader);

  return bufferViewLoader;
}

function loadPrimitive(
  loader: GltfLoader,
  gltf: glTF,
  gltfPrimitive: Primitive,
  hasInstances: boolean,
  supportedImageFormats: SupportedImageFormats,
  frameState: FrameState
) {
  const primitive = new ModelComponents.Primitive();
  const primitivePlan = new PrimitiveLoadPlan(primitive);
  loader._primitiveLoadPlans.push(primitivePlan);

  const materialIndex = gltfPrimitive.material;
  if (defined(materialIndex)) {
    primitive.material = loadMaterial(
      loader,
      gltf,
      gltf.materials[materialIndex],
      supportedImageFormats,
      frameState,
    );
  }

  const extensions = defaultValue(gltfPrimitive.extensions, defaultValue.EMPTY_OBJECT);

  let needsPostProcessing = false;
  const outlineExtension = extensions.CESIUM_primitive_outline;
  if (defined(outlineExtension)) {
    needsPostProcessing = true;
    primitivePlan.needsOutlines = true;
    primitivePlan.outlineIndices = loadPrimitiveOutline(
      loader,
      gltf,
      outlineExtension,
      // primitivePlan
    );
  }

  const draco: KHRDracoMeshCompressionExtension = extensions.KHR_draco_mesh_compression;
  const attributes = gltfPrimitive.attributes;
  if (defined(attributes)) {
    for (const semantic in attributes) {
      if (attributes.hasOwnProperty(semantic)) {
        const accessorIndex = attributes[semantic];
        const semanticInfo = getSemanticInfo(loader, VertexAttributeSemantic, semantic);

        const modelSemantic = semanticInfo.modelSemantic;

        if (modelSemantic === VertexAttributeSemantic.FEATURE_ID) {
          throw new Error("To be implemented");
        }

        const attributePlan = loadVertexAttribute(
          loader,
          gltf,
          accessorIndex,
          semanticInfo,
          draco,
          hasInstances,
          needsPostProcessing,
          frameState
        );

        primitivePlan.attributePlans.push(attributePlan);
        primitive.attributes.push(attributePlan.attribute);
      }
    }
  }

  const targets = gltfPrimitive.targets;
  if (defined(targets)) {
    throw new Error("loadPrimitive: To be implemented");
  }

  const indices = gltfPrimitive.indices;
  if (defined(indices)) {
    const indicesPlan = loadIndices(
      loader,
      gltf,
      indices,
      draco,
      needsPostProcessing,
      frameState
    );

    if (defined(indicesPlan)) {
      primitivePlan.indicesPlan = indicesPlan;
      primitive.indices = indicesPlan.indices;
    }
  }

  const primitiveType = gltfPrimitive.mode;
  primitive.primitiveType = primitiveType;

  return primitive;
}

function loadNode(
  loader: GltfLoader,
  gltf: glTF,
  gltfNode: Node,
  supportedImageFormats: SupportedImageFormats,
  frameState: FrameState
) {
  const node = new ModelComponents.Node();
  node.name = gltfNode.name;

  if (defined(gltfNode.matrix)) {
    node.matrix = Matrix4.unpack(gltfNode.matrix);
  }
  if (defined(gltfNode.translation)) {
    node.translation = Cartesian3.unpack(gltfNode.translation);
  }
  if (defined(gltfNode.rotation)) {
    node.rotation = Quaternion.unpack(gltfNode.rotation);
  }
  if (defined(gltfNode.scale)) {
    node.scale = Cartesian3.unpack(gltfNode.scale);
  }

  const nodeExtensions = gltfNode.extensions;
  const instancingExtension = nodeExtensions?.EXT_mesh_gpu_instancing;
  if (defined(instancingExtension)) {
    node.instances = loadInstances(loader, gltf, nodeExtensions, frameState) as unknown as ModelComponents.Instances;
  }

  const meshIndex = gltfNode.mesh;
  if (defined(meshIndex)) {
    const mesh = gltf.meshes[meshIndex];
    const primitives = mesh.primitives;
    const primitivesLength = primitives.length;

    for (let i = 0; i < primitivesLength; i++) {
      node.primitives.push(loadPrimitive(
        loader,
        gltf,
        primitives[i],
        defined(node.instances),
        supportedImageFormats,
        frameState
      ));
    }

    // const morphWeights = defaultValue(gltfNode.weights, mesh.weights);
    // node.morphWeights = ??
  }

  return node;
}

function loadNodes(
  loader: GltfLoader,
  gltf: glTF,
  supportedImageFormats: SupportedImageFormats,
  frameState: FrameState
) {
  if (!defined(gltf.nodes)) {
    return [];
  }

  let i, j;

  const nodesLength = gltf.nodes.length;
  const nodes: ModelComponents.Node[] = new Array(nodesLength);
  for (i = 0; i < nodesLength; i++) {
    const node = loadNode(loader, gltf, gltf.nodes[i], supportedImageFormats, frameState);
    node.index = i;

    nodes[i] = node;
  }

  for (i = 0; i < nodesLength; i++) {
    const childrenNodeIndices = gltf.nodes[i].children;

    if (defined(childrenNodeIndices)) {
      const childrenLength = childrenNodeIndices.length;

      for (j = 0; j < childrenLength; j++) {
        const childNodeIndex = childrenNodeIndices[j];
        const childNode = nodes[childNodeIndex];
        nodes[i].children.push(childNode);
      }

    }
  }

  return nodes;
}

function loadScene(gltf: glTF, nodes: ModelComponents.Node[]) {
  const scene = new ModelComponents.Scene();

  let sceneNodesIndices: number[] = [];
  if (defined(gltf.scenes) && defined(gltf.scene)) {
    sceneNodesIndices = gltf.scenes[gltf.scene].nodes;
  }

  scene.nodes = sceneNodesIndices.map(nodeIndex => nodes[nodeIndex]);

  return scene;
}

function parse(
  gltfLoader: GltfLoader,
  gltf: glTF,
  supportedImageFormats: SupportedImageFormats,
  frameState: FrameState,
  reject: () => void,
  rejectTextures: () => void
) {
  const nodes = loadNodes(gltfLoader, gltf, supportedImageFormats, frameState);
  // const skins = loadSkins(gltf);
  // const animations = loadAnimations(gltf);
  const scene = loadScene(gltf, nodes);

  const components = new ModelComponents.Components();
  components.nodes = nodes;
  components.scene = scene;

  gltfLoader._components = components;

  // Gather promises and reject if any promise fail.
  const readyPromises = [];
  readyPromises.push.apply(readyPromises, gltfLoader._loaderPromises);

  if (!gltfLoader._incrementallyLoadTextures) {
    readyPromises.push.apply(readyPromises, gltfLoader._texturesPromises);
  }

  Promise.all(readyPromises)
    .then(function() {
      if (gltfLoader.isDestroyed()) {
        return;
      }

      gltfLoader._state = GltfLoaderState.POST_PROCESSING;
    })
    .catch(reject);

  Promise.all(gltfLoader._texturesPromises)
    .then(function() {
      if (gltfLoader.isDestroyed()) {
        return;
      }

      // post processing only applies for geometry
      gltfLoader._textureState = GltfLoaderState.PROCESSED;
    })
    .catch(rejectTextures);
}

enum GltfLoaderState {
  NOT_LOADED,
  LOADING,
  LOADED,
  PROCESSING,
  POST_PROCESSING,
  PROCESSED,
  READY,
  FAILED,
  UNLOADED,
}

class GltfLoader extends ResourceLoader {
  _textureLoaders: GltfTextureLoader[];
  _bufferViewLoaders: GltfBufferViewLoader[];
  _geometryLoaders: (GltfVertexBufferLoader | GltfIndexBufferLoader)[];

  _loaderPromises: Promise<void>[];
  _texturesPromises: Promise<void>[];

  _primitiveLoadPlans: PrimitiveLoadPlan[];

  _gltfJson: glTF;
  _typedArray: Uint8Array;
  _gltfResource: Resource;
  _baseResource: Resource;
  _asynchronous: boolean;

  _gltfJsonLoader: GltfJsonLoader;

  _components: ModelComponents.Components;

  _postProcessBuffers: Buffer[];

  _state: GltfLoaderState;
  _textureState: GltfLoaderState;
  _promise: Promise<GltfLoader> | undefined;
  _texturesLoadedPromise: Promise<void>;

  _renameBatchIdSemantic: boolean;
  _incrementallyLoadTextures: boolean;
  _releaseGltfJson: boolean;

  _process: (loader: GltfLoader, frameState: FrameState) => void;
  _processTextures: (loader: GltfLoader, frameState: FrameState) => void;

  get promise() { return this._promise; }
  get cacheKey() { return undefined; }
  get components() { return this._components; }

  constructor(options: {
    gltfResource: Resource;
    baseResource?: Resource;
    gltfJson?: glTF,
    typedArray?: Uint8Array,
    asynchronous?: boolean,
    incrementallyLoadTextures?: boolean,
    releaseGltfJson?: boolean,
  }) {
    super();

    const gltfResource = options.gltfResource;
    const baseResource = defaultValue(options.baseResource, gltfResource.clone());
    const asynchronous = defaultValue(options.asynchronous, true);
    const incrementallyLoadTextures = defaultValue(options.incrementallyLoadTextures, true);

    this._textureLoaders = [];
    this._bufferViewLoaders = [];
    this._geometryLoaders = [];
    this._loaderPromises = [];
    this._texturesPromises = [];

    this._primitiveLoadPlans = [];

    this._gltfJson = options.gltfJson;
    this._typedArray = options.typedArray;
    this._gltfResource = gltfResource;
    this._baseResource = baseResource;
    this._asynchronous = asynchronous;

    this._renameBatchIdSemantic = false;
    this._state = GltfLoaderState.NOT_LOADED;
    this._textureState = GltfLoaderState.NOT_LOADED;
    this._incrementallyLoadTextures = incrementallyLoadTextures;
    this._releaseGltfJson = defaultValue(options.releaseGltfJson, false);

    this._postProcessBuffers = [];

    this._process = () => {};
    this._processTextures = () => {};
  }

  load() {
    const gltfJsonLoader = ResourceCache.loadGltfJson({
      gltfResource: this._gltfResource,
      baseResource: this._baseResource,
      typedArray: this._typedArray,
      gltfJson: this._gltfJson,
    });
    this._gltfJsonLoader = gltfJsonLoader;

    this._state = GltfLoaderState.LOADING;
    this._textureState = GltfLoaderState.LOADING;

    const gltfLoader = this;
    let textureProcessPromise;
    const processPromise: Promise<GltfLoader> = new Promise(function(resolve, reject) {
      textureProcessPromise = new Promise(function(resolveTextures, rejectTextures) {
        gltfLoader._process = function(loader, frameState) {
          if (gltfLoader._state === GltfLoaderState.LOADED) {
            // Fetched glTF JSON
            gltfLoader._state = GltfLoaderState.PROCESSING;

            const gltf = defaultValue(gltfLoader._gltfJsonLoader?.gltf, gltfLoader._gltfJson)

            const supportedImageFormats = new SupportedImageFormats({
              // TODO: hardcode
              webp: true,
              basis: false,
            });

            // Parse the glTF which populates the loaders arrays. The promise will
            // resolve once all the loaders are ready (i.e. all external resources
            // have been fetched and all GPU resources have been created). Loaders that
            // create GPU resources need to be processed every frame until they become
            // ready since the JobScheduler is not able to execute all jobs in a single
            // frame. Also note that it's fine to call process before a loader is ready
            // to process; nothing will happen.
            parse(
              gltfLoader,
              gltf,
              supportedImageFormats,
              frameState,
              reject,
              rejectTextures
            );

            // TODO: Release gltfJsonLoader ...
            if (defined(gltfLoader._gltfJsonLoader) && gltfLoader._releaseGltfJson) {
              ResourceCache.unload(gltfLoader._gltfJsonLoader);
              gltfLoader._gltfJsonLoader = undefined;
            }
          }

          if (gltfLoader._state === GltfLoaderState.PROCESSING) {
            processLoaders(gltfLoader, frameState);
          }

          if (gltfLoader._state === GltfLoaderState.POST_PROCESSING) {
            postProcessGeometry(gltfLoader, frameState.context);
            gltfLoader._state = GltfLoaderState.PROCESSED;
          }

          if (gltfLoader._state === GltfLoaderState.PROCESSED) {
            // The buffer views can be unloaded once the data is copied.
            unloadBufferViews(gltfLoader);

            // Similarly, if the glTF was loaded from a typed array, release the memory
            gltfLoader._typedArray = undefined;

            gltfLoader._state = GltfLoaderState.READY;
            resolve(gltfLoader);
          }
        };

        gltfLoader._processTextures = function(loader, frameState) {
          if (loader._textureState === GltfLoaderState.LOADED) {
            loader._textureState = GltfLoaderState.PROCESSING;
          }

          if (loader._textureState === GltfLoaderState.PROCESSING) {
            for (const textureLoader of loader._textureLoaders) {
              textureLoader.process(frameState);
            };
          }

          if (loader._textureState === GltfLoaderState.PROCESSED) {
            loader._textureState = GltfLoaderState.READY;
            resolveTextures(loader);
          }
        };

      })
    });

    this._promise = gltfJsonLoader.promise
      .then(function() {
        if (gltfLoader.isDestroyed()) {
          return;
        }

        gltfLoader._state = GltfLoaderState.LOADED;
        gltfLoader._textureState = GltfLoaderState.LOADED;

        return processPromise;
      })
      .catch(function(error) {
        if (gltfLoader.isDestroyed()) {
          return;
        }
        gltfLoader._state = GltfLoaderState.FAILED;
        gltfLoader._textureState = GltfLoaderState.FAILED;
        return handleError(gltfLoader, error);
      });

    this._texturesLoadedPromise = textureProcessPromise.catch(function (error) {
      if (gltfLoader.isDestroyed()) {
        return;
      }
  
      gltfLoader._textureState = GltfLoaderState.FAILED;
      return handleError(gltfLoader, error);
    });

    return this._promise;
  }

  process(frameState: FrameState) {
    this._process(this, frameState);
    this._processTextures(this, frameState);
  }

  unload() {
    if (defined(this._gltfJsonLoader)) {
      ResourceCache.unload(this._gltfJsonLoader);
    }
    this._gltfJsonLoader = undefined;

    unloadTextures(this);
    unloadBufferViews(this);
    unloadGeometry(this);
    unloadGeneratedAttributes(this);

    this._components = undefined;
    this._typedArray = undefined;
    this._state = GltfLoaderState.UNLOADED;
  }

  isUnloaded() {
    return this._state === GltfLoaderState.UNLOADED;
  }
}

/**
 * Process buffer view loaders and geometry loaders.
 * @internal
 * @param gltfLoader 
 * @param frameState 
 */
function processLoaders(gltfLoader: GltfLoader, frameState: FrameState) {
  const bufferViewLoaders = gltfLoader._bufferViewLoaders;
  const bufferViewLoadersLength = bufferViewLoaders.length;
  for (let i = 0; i < bufferViewLoadersLength; ++i) {
    bufferViewLoaders[i].process(frameState);
  }

  const geometryLoaders = gltfLoader._geometryLoaders;
  const geometryLoadersLength = geometryLoaders.length;
  for (let i = 0; i < geometryLoadersLength; ++i) {
    geometryLoaders[i].process(frameState);
  }

}

function postProcessGeometry(gltfLoader: GltfLoader, context: Context) {
  for (const primitiveLoadPlan of gltfLoader._primitiveLoadPlans) {
    primitiveLoadPlan.postProcess(context);

    if (primitiveLoadPlan.needsOutlines) {
      gatherPostProcessBuffers(gltfLoader, primitiveLoadPlan);
    }
  }
}

function gatherPostProcessBuffers(gltfLoader: GltfLoader, primitiveLoadPlan: PrimitiveLoadPlan) {
  
}

function unloadBufferViews(gltfLoader: GltfLoader) {
  const bufferViewLoaders = gltfLoader._bufferViewLoaders;
  for (const bufferViewLoader of bufferViewLoaders) {
    ResourceCache.unload(bufferViewLoader);
  }

  gltfLoader._bufferViewLoaders.length = 0;
}

function unloadTextures(gltfLoader: GltfLoader) {
  for (const textureLoader of gltfLoader._textureLoaders) {
    ResourceCache.unload(textureLoader);
  }
  gltfLoader._textureLoaders.length = 0;
}

function unloadGeometry(gltfLoader: GltfLoader) {
  for (const geometryLoader of gltfLoader._geometryLoaders) {
    ResourceCache.unload(geometryLoader);
  }
  gltfLoader._geometryLoaders.length = 0;
}

function unloadGeneratedAttributes(gltfLoader: GltfLoader) {
  for (const postProcessBuffer of gltfLoader._postProcessBuffers) {
    if (!postProcessBuffer.isDestroyed()) {
      postProcessBuffer.destroy();
    }
  }
  gltfLoader._postProcessBuffers.length = 0;
}

function handleError(gltfLoader: GltfLoader, error: Error) {
  gltfLoader.unload();
  const errorMessage = "Failed to load glTF";
  error = gltfLoader.getError(errorMessage, error);
  return Promise.reject(error);
}

export default GltfLoader;
