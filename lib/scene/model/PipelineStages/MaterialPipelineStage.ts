import defaultValue from "../../../core/defaultValue";
import defined from "../../../core/defined";
import Cartesian3 from "../../../math/Cartesian3";
import Cartesian4 from "../../../math/Cartesian4";
import Matrix3 from "../../../math/Matrix3";
import { UniformMap } from "../../../renderer/IDrawCommand";
import ShaderBuilder from "../../../renderer/ShaderBuilder";
import ShaderDestination from "../../../renderer/ShaderDestination";
import Texture from "../../../renderer/Texture";
import FrameState from "../../FrameState";
import AlphaMode from "../AlphaMode";
import { Clearcoat, EmissiveStrength, Material, MetallicRoughness, Primitive, Specular, TextureReader } from "../ModelComponents";
import ModelUtility from "../ModelUtility";
import PrimitiveRenderResources from "../PrimitiveRenderResources";
import VertexAttributeSemantic from "../VertexAttributeSemantic";
import Pass from "../../../renderer/Pass";
import modelMaterialStruct from "../../../shaders/model/modelMaterial.glsl";
import MaterialStageFS from "../../../shaders/model/MaterialStageFS.glsl";

function processEmissiveStrength(material: Material, uniformMap: UniformMap, shaderBuilder: ShaderBuilder) {
  shaderBuilder.addDefine('USE_EMISSIVE_STRENGTH', undefined, ShaderDestination.FRAGMENT);

  const emissiveStrength = material.emissiveStrength;

  if (defined(emissiveStrength) && emissiveStrength.emissiveStrength !== EmissiveStrength.DEFAULT_EMISSIVE_STRENGTH) {
    shaderBuilder.addDefine('HAS_EMISSIVE_STRENGTH', undefined, ShaderDestination.FRAGMENT);
    shaderBuilder.addUniform('float', 'u_emissiveStrength', ShaderDestination.FRAGMENT);
    uniformMap.u_emissiveStrength = function () { return emissiveStrength.emissiveStrength; }
  }
}

function processSpecular(
  material: Material,
  uniformMap: UniformMap,
  shaderBuilder: ShaderBuilder,
  defaultSpecularTexture: Texture,
  defaultSpecularColorTexture: Texture,
  disableTextures: boolean
) {
  shaderBuilder.addDefine('USE_SPECULAR', undefined, ShaderDestination.FRAGMENT);

  const specular = material.specular;

  if (defined(specular.specularTexture) && !disableTextures) {
    processTexture(shaderBuilder, uniformMap, specular.specularTexture, 'u_specularTexture', 'SPECULAR', defaultSpecularTexture);
  }
  const specularFactor = specular.specularFactor;
  if (defined(specularFactor) && specularFactor !== Specular.DEFAULT_SPECULAR_FACTOR) {
    shaderBuilder.addDefine('HAS_SPECULAR_FACTOR', undefined, ShaderDestination.FRAGMENT);
    shaderBuilder.addUniform('float', 'u_specularFactor', ShaderDestination.FRAGMENT);
    uniformMap.u_specularFactor = function() { return specular.specularFactor; };
  }

  if (defined(specular.specularColorTexture) && !disableTextures) {
    processTexture(shaderBuilder, uniformMap, specular.specularColorTexture, 'u_specularColorTexture', 'SPECULAR_COLOR', defaultSpecularColorTexture);
  }
  const specularColorFactor = specular.specularColorFactor;
  if (
    defined(specularColorFactor) &&
    !Cartesian3.equals(specularColorFactor, Specular.DEFAULT_SPECULAR_COLOR_FACTOR)
  ) {
    shaderBuilder.addDefine('HAS_SPECULAR_COLOR_FACTOR', undefined, ShaderDestination.FRAGMENT);
    shaderBuilder.addUniform('float', 'u_specularColorFactor', ShaderDestination.FRAGMENT);
    uniformMap.u_specularColorFactor = function() { return specular.specularColorFactor; };
  }
}

function processClearcoat(
  material: Material,
  uniformMap: UniformMap,
  shaderBuilder: ShaderBuilder,
  defaultClearcoatTexture: Texture,
  defaultClearcoatRoughnessTexture: Texture,
  defaultClearcoatNormalTexture: Texture,
  disableTextures: boolean
) {
  shaderBuilder.addDefine('USE_CLEARCOAT', undefined, ShaderDestination.FRAGMENT);

  const clearcoat = material.clearcoat;

  if (defined(clearcoat.clearcoatTexture) && !disableTextures) {
    processTexture(shaderBuilder, uniformMap, clearcoat.clearcoatTexture, 'u_clearcoatTexture', 'CLEARCOAT', defaultClearcoatTexture);
  }
  if (defined(clearcoat.clearcoatFactor) && clearcoat.clearcoatFactor !== Clearcoat.DEFAULT_CLEARCOAT_FACTOR) {
    shaderBuilder.addDefine('HAS_CLEARCOAT_FACTOR', undefined, ShaderDestination.FRAGMENT);
    shaderBuilder.addUniform('float', 'u_clearcoatFactor', ShaderDestination.FRAGMENT);
    uniformMap.u_clearcoatFactor = function () { return clearcoat.clearcoatFactor; }
  }

  if (defined(clearcoat.clearcoatRoughnessTexture) && !disableTextures) {
    processTexture(shaderBuilder, uniformMap, clearcoat.clearcoatRoughnessTexture, 'u_clearcoatRoughnessTexture', 'CLEARCOAT_ROUGHNESS', defaultClearcoatRoughnessTexture);
  }
  if (defined(clearcoat.clearcoatRoughnessFactor) && clearcoat.clearcoatRoughnessFactor !== Clearcoat.DEFAULT_CLEARCOAT_ROUGHNESS_FACTOR) {
    shaderBuilder.addDefine('HAS_CLEARCOAT_ROUGHNESS_FACTOR', undefined, ShaderDestination.FRAGMENT);
    shaderBuilder.addUniform('float', 'u_clearcoatRoughnessFactor', ShaderDestination.FRAGMENT);
    uniformMap.u_clearcoatRoughnessFactor = function () { return clearcoat.clearcoatRoughnessFactor; }
  }

  if (defined(clearcoat.clearcoatNormalTexture) && !disableTextures) {
    processTexture(shaderBuilder, uniformMap, clearcoat.clearcoatNormalTexture, 'u_clearcoatNormalTexture', 'CLEARCOAT_NORMAL', defaultClearcoatNormalTexture)
  }
}

function processMetallicRoughnessUniforms(
  material: Material,
  uniformMap: UniformMap,
  shaderBuilder: ShaderBuilder,
  defaultTexture: Texture,
  disableTextures: boolean
) {
  shaderBuilder.addDefine('USE_METALLIC_ROUGHNESS', undefined, ShaderDestination.FRAGMENT);

  const metallicRoughness = material.metallicRoughness;

  const baseColorTexture = metallicRoughness.baseColorTexture;
  if (defined(baseColorTexture) && !disableTextures) {
    processTexture(
      shaderBuilder,
      uniformMap,
      baseColorTexture,
      'u_baseColorTexture',
      'BASE_COLOR',
      defaultTexture
    );
  }

  const baseColorFactor = metallicRoughness.baseColorFactor;
  if (
    defined(baseColorFactor) &&
    !Cartesian4.equals(baseColorFactor, MetallicRoughness.DEFAULT_BASE_COLOR_FACTOR)
  ) {
    shaderBuilder.addDefine('HAS_BASE_COLOR_FACTOR', undefined, ShaderDestination.FRAGMENT);
    shaderBuilder.addUniform('vec4', 'u_baseColorFactor', ShaderDestination.FRAGMENT);
    uniformMap.u_baseColorFactor = function() { return metallicRoughness.baseColorFactor; };
  }

  const metallicRoughnessTexture = metallicRoughness.metallicRoughnessTexture;
  if (defined(metallicRoughnessTexture) && !disableTextures) {
    processTexture(
      shaderBuilder,
      uniformMap,
      metallicRoughnessTexture,
      'u_metallicRoughnessTexture',
      'METALLIC_ROUGHNESS',
      defaultTexture
    );
  }

  const metallicFactor = metallicRoughness.metallicFactor;
  if (
    defined(metallicFactor) &&
    metallicFactor !== MetallicRoughness.DEFAULT_METALLIC_FACTOR
  ) {
    shaderBuilder.addDefine('HAS_METALLIC_FACTOR', undefined, ShaderDestination.FRAGMENT);
    shaderBuilder.addUniform('float', 'u_metallicFactor', ShaderDestination.FRAGMENT);
    uniformMap.u_metallicFactor = function() { return metallicRoughness.metallicFactor; };
  }

  const roughnessFactor = metallicRoughness.roughnessFactor;
  if (
    defined(roughnessFactor) &&
    roughnessFactor !== MetallicRoughness.DEFAULT_ROUGHNESS_FACTOR
  ) {
    shaderBuilder.addDefine('HAS_ROUGHNESS_FACTOR', undefined, ShaderDestination.FRAGMENT);
    shaderBuilder.addUniform('float', 'u_roughnessFactor', ShaderDestination.FRAGMENT);
    uniformMap.u_roughnessFactor = function() { return metallicRoughness.roughnessFactor; };
  }
}

const MaterialPipelineStage = {
  name: 'MaterialPipelineStage', // Helps with debugging
  process: function (renderResources: PrimitiveRenderResources, primitive: Primitive, frameState: FrameState) {
    const material = primitive.material;
    const model = renderResources.model;
    const uniformMap = renderResources.uniformMap;
    const shaderBuilder = renderResources.shaderBuilder;
    const context = frameState.context;

    const disableTextures = false;
    const defaultTexture = context.defaultTexture;
    const defaultEmissiveTexture = context.defaultEmissiveTexture;
    const defaultNormalTexture = context.defaultNormalTexture;

    processMaterialUniforms(
      material,
      uniformMap,
      shaderBuilder,
      defaultTexture,
      defaultNormalTexture,
      defaultEmissiveTexture,
      disableTextures
    );

    processMetallicRoughnessUniforms(
      material,
      uniformMap,
      shaderBuilder,
      defaultTexture,
      disableTextures
    );

    if (defined(material.emissiveStrength)) {
      processEmissiveStrength(material, uniformMap, shaderBuilder);
    }

    if (defined(material.specular)) {
      const defaultSpecularTexture = context.defaultSpecularTexture;
      const defaultSpecularColorTexture = context.defaultSpecularTexture;
      processSpecular(material, uniformMap, shaderBuilder, defaultSpecularTexture, defaultSpecularColorTexture, disableTextures);
    }

    if (defined(material.clearcoat)) {
      const defaultClearcoatTexture = context.defaultClearcoatTexture;
      const defaultClearcoatRoughnessTexture = context.defaultClearcoatTexture;
      const defaultClearcoatNormalTexture = context.defaultNormalTexture;
      processClearcoat(material, uniformMap, shaderBuilder, defaultClearcoatTexture, defaultClearcoatRoughnessTexture, defaultClearcoatNormalTexture, disableTextures);
    }

    const hasNormals = ModelUtility.getAttributeBySemantic(primitive, VertexAttributeSemantic.NORMAL);

    const cull = model.backFaceCulling && !material.doubleSided;
    renderResources.renderStateOptions.cull.enabled = cull;

    const alphaOptions = renderResources.alphaOptions;
    if (material.alphaMode === AlphaMode.BLEND) {
      alphaOptions.pass = Pass.TRANSLUCENT;
    } else if (material.alphaMode === AlphaMode.MASK) {
      alphaOptions.alphaCutOff = material.alphaCutoff;
    }

    shaderBuilder.addFragmentLines([
      modelMaterialStruct,
      MaterialStageFS,
    ]);

    if (material.doubleSided) {
      shaderBuilder.addDefine('HAS_DOUBLE_SIDED_MATERIAL', undefined, ShaderDestination.BOTH);
    }
  },
};

function processMaterialUniforms(
  material: Material,
  uniformMap: UniformMap,
  shaderBuilder: ShaderBuilder,
  defaultTexture: Texture,
  defaultNormalTexture: Texture,
  defaultEmissiveTexture: Texture,
  disableTextures: boolean
) {
  const emissiveTexture = material.emissiveTexture;
  if (defined(emissiveTexture) && !disableTextures) {
    processTexture(
      shaderBuilder,
      uniformMap,
      emissiveTexture,
      'u_emissiveTexture',
      'EMISSIVE',
      defaultEmissiveTexture
    );
  }

  const emissiveFactor = material.emissiveFactor;
  if (
    defined(emissiveFactor) &&
    !Cartesian3.equals(emissiveFactor, Material.DEFAULT_EMISSIVE_FACTOR)
  ) {
    shaderBuilder.addDefine('HAS_EMISSIVE_FACTOR', undefined, ShaderDestination.FRAGMENT);
    shaderBuilder.addUniform('vec3', 'u_emissiveFactor', ShaderDestination.FRAGMENT);
    uniformMap.u_emissiveFactor = function() {
      return material.emissiveFactor;
    };
  }

  const normalTexture = material.normalTexture;
  if (defined(normalTexture) && !disableTextures) {
    processTexture(
      shaderBuilder,
      uniformMap,
      normalTexture,
      'u_normalTexture',
      'NORMAL',
      defaultNormalTexture
    );
  }

  const occlusionTexture = material.occlusionTexture;
  if (defined(occlusionTexture) && !disableTextures) {
    processTexture(
      shaderBuilder,
      uniformMap,
      occlusionTexture,
      'u_occlusionTexture',
      'OCCLUSION',
      defaultTexture
    );
  }
}

/**
 * Process a single texture and add it to the shader and uniform map.
 * Also add
 *   `HAS_${defineName}_TEXTURE`,
 *   `TEXCOORD_${defineName}`,
 *   `HAS_${defineName}_TEXTURE_TRANSFORM` define marcos
 *   and `${uniformName}`, `${uniformName}Transform` uniform
 * @internal
 * @param shaderBuilder 
 * @param uniformMap 
 * @param textureReader 
 * @param uniformName 
 * @param defineName 
 * @param defaultTexture 
 */
function processTexture(
  shaderBuilder: ShaderBuilder,
  uniformMap: UniformMap,
  textureReader: TextureReader,
  uniformName: string,
  defineName: string,
  defaultTexture: Texture
) {
  // Add a uniform for the texture itself
  shaderBuilder.addUniform('sampler2D', uniformName, ShaderDestination.FRAGMENT);
  uniformMap[uniformName] = function() {
    return defaultValue(textureReader.texture, defaultTexture);
  };

  // Add a #define directive to enable using the texture in the shader
  const textureDefine = `HAS_${defineName}_TEXTURE`;
  shaderBuilder.addDefine(textureDefine, undefined, ShaderDestination.FRAGMENT);

  // Add a #define to tell the shader which texture coordinates varying to use.
  const texCoordIndex = textureReader.texCoord;
  const texCoordVarying = `v_texCoord_${texCoordIndex}`;
  const texCoordDefine = `TEXCOORD_${defineName}`;
  shaderBuilder.addDefine(texCoordDefine, texCoordVarying, ShaderDestination.FRAGMENT);

  // Some textures have matrix transforms (e.g. for texture atlases). Add those
  // to the shader if present.
  const textureTransform = textureReader.transform;
  if (defined(textureTransform) && !Matrix3.equals(textureTransform, Matrix3.IDENTITY)) {
    processTextureTransform(
      shaderBuilder,
      uniformMap,
      textureReader,
      uniformName,
      defineName
    );
  }
}

function processTextureTransform(
  shaderBuilder: ShaderBuilder,
  uniformMap: UniformMap,
  textureReader: TextureReader,
  uniformName: string,
  defineName: string
) {
  // Add a define to enable the texture transformation code in the shader.
  const transformDefine = `HAS_${defineName}_TEXTURE_TRANSFORM`;
  shaderBuilder.addDefine(transformDefine, undefined, ShaderDestination.FRAGMENT);

  // Add a uniform for the transformation matrix
  const transformUniformName = `${uniformName}Transform`;
  shaderBuilder.addUniform('mat3', transformUniformName, ShaderDestination.FRAGMENT);
  uniformMap[transformUniformName] = function() {
    return textureReader.transform;
  };
}

export default MaterialPipelineStage;
