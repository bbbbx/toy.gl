import DeveloperError from "../../../core/DeveloperError";
import defined from "../../../core/defined";
import Cartesian2 from "../../../math/Cartesian2";
import Cartesian3 from "../../../math/Cartesian3";
import Cartesian4 from "../../../math/Cartesian4";
import Matrix2 from "../../../math/Matrix2";
import Matrix3 from "../../../math/Matrix3";
import Matrix4 from "../../../math/Matrix4";
import { VertexArrayAttribute } from "../../../renderer/IVertexArray";
import ShaderBuilder from "../../../renderer/ShaderBuilder";
import FrameState from "../../FrameState";
import AttributeType from "../AttributeType";
import { Attribute, Primitive } from "../ModelComponents";
import PrimitiveRenderResources from "../PrimitiveRenderResources";
import VertexAttributeSemantic from "../VertexAttributeSemantic";
import ShaderDestination from "../../../renderer/ShaderDestination";
import getNumberOfComponentsFromAttributeType from "../../getNumberOfComponentsFromAttributeType";
import GeometryStageVS from "../../../shaders/model/GeometryStageVS.glsl";
import GeometryStageFS from "../../../shaders/model/GeometryStageFS.glsl";


function getVariableName(semantic: VertexAttributeSemantic, setIndex?: number) {
  let variableName: 'positionMC' | 'normalMC' | 'tangentMC' | 'texCoord' | 'color' | 'joints' | 'weights' | 'featureId';
  switch (semantic) {
    case VertexAttributeSemantic.POSITION:
      variableName = 'positionMC';
      break;
    case VertexAttributeSemantic.NORMAL:
      variableName = 'normalMC';
      break;
    case VertexAttributeSemantic.TANGENT:
      variableName = 'tangentMC';
      break;
    case VertexAttributeSemantic.TEXCOORD:
      variableName = 'texCoord';
      break;
    case VertexAttributeSemantic.COLOR:
      variableName = 'color';
      break;
    case VertexAttributeSemantic.JOINTS:
      variableName = 'joints';
      break;
    case VertexAttributeSemantic.WEIGHTS:
      variableName = 'weights';
      break;
    case VertexAttributeSemantic.FEATURE_ID:
      variableName = 'featureId';
      break;
    default:
      throw new DeveloperError('semantic is not a valid value.');
  }

  if (defined(setIndex)) {
    variableName += `_${setIndex}`;
  }

  return variableName;
}

function getAttributeInfo(attribute: Attribute) {
  let variableName = '';
  if (defined(attribute.semantic)) {
    variableName = getVariableName(attribute.semantic, attribute.setIndex);
  } else {
    variableName = attribute.name
      .replace(/^_/, '') // According to the glTF 2.0 spec, custom attributes must be prepended with an underscore.
      .toLowerCase();
  }
  const glslType = getGlslType(attribute.type);

  return {
    variableName,
    glslType,
    attribute,
  };
}
type AttributeInfo = ReturnType<typeof getAttributeInfo>;

function getGlslType(attributeType: AttributeType) {
  switch (attributeType) {
    case AttributeType.SCALAR:
      return 'float';
    case AttributeType.VEC2:
      return 'vec2';
    case AttributeType.VEC3:
      return 'vec3';
    case AttributeType.VEC4:
      return 'vec4';
    case AttributeType.MAT2:
      return 'mat2';
    case AttributeType.MAT3:
      return 'mat3';
    case AttributeType.MAT4:
      return 'mat4';
    default:
      throw new Error('attributeType is not a valid value.');
  }
}

function getAttributeLocationCount(attributeType: AttributeType) {
  switch (attributeType) {
    case AttributeType.SCALAR:
    case AttributeType.VEC2:
    case AttributeType.VEC3:
    case AttributeType.VEC4:
      return 1;
    case AttributeType.MAT2:
      return 2;
    case AttributeType.MAT3:
      return 3;
    case AttributeType.MAT4:
      return 4;
    default:
      throw new Error('attributeType is not a valid value.');
  }
}

const GeometryPipelineStage = {
  name: 'GeometryPipelineStage', // Helps with debugging
  STRUCT_ID_PROCESSED_ATTRIBUTES_VS: 'ProcessedAttributesVS',
  STRUCT_ID_PROCESSED_ATTRIBUTES_FS: 'ProcessedAttributesFS',
  STRUCT_NAME_PROCESSED_ATTRIBUTES: 'ProcessedAttributes',

  FUNCTION_ID_INITIALIZE_ATTRIBUTES: 'initializeAttributes',
  FUNCTION_SIGNATURE_INITIALIZE_ATTRIBUTES: 'void initializeAttributes(out ProcessedAttributes attributes)',
  FUNCTION_ID_SET_DYNAMIC_VARYING_VS: 'setDynamicVaryingsVS',
  FUNCTION_ID_SET_DYNAMIC_VARYING_FS: 'setDynamicVaryingsFS',
  FUNCTION_SIGNATURE_SET_DYNAMIC_VARYING: 'void setDynamicVaryings(inout ProcessedAttributes attributes)',
  process: function (renderResources: PrimitiveRenderResources, primitive: Primitive, frameState: FrameState) {
    const shaderBuilder = renderResources.shaderBuilder;

    shaderBuilder.addStruct(GeometryPipelineStage.STRUCT_ID_PROCESSED_ATTRIBUTES_VS, GeometryPipelineStage.STRUCT_NAME_PROCESSED_ATTRIBUTES, ShaderDestination.VERTEX);
    shaderBuilder.addStruct(GeometryPipelineStage.STRUCT_ID_PROCESSED_ATTRIBUTES_FS, GeometryPipelineStage.STRUCT_NAME_PROCESSED_ATTRIBUTES, ShaderDestination.FRAGMENT);

    shaderBuilder.addFunction(GeometryPipelineStage.FUNCTION_ID_INITIALIZE_ATTRIBUTES, GeometryPipelineStage.FUNCTION_SIGNATURE_INITIALIZE_ATTRIBUTES, ShaderDestination.VERTEX);

    // Positions in other coordinate systems are always available in fragment shader.
    shaderBuilder.addVarying('vec3', 'v_positionWC');
    shaderBuilder.addVarying('vec3', 'v_positionEC');
    shaderBuilder.addStructField(GeometryPipelineStage.STRUCT_ID_PROCESSED_ATTRIBUTES_FS, 'vec3', 'positionWC');
    shaderBuilder.addStructField(GeometryPipelineStage.STRUCT_ID_PROCESSED_ATTRIBUTES_FS, 'vec3', 'positionEC');

    // Though they have identical signatures, the implementation is different
    // between vertex and fragment shaders. The VS stores attributes in
    // varyings, while the FS unpacks the varyings for use by other stages.
    shaderBuilder.addFunction(GeometryPipelineStage.FUNCTION_ID_SET_DYNAMIC_VARYING_VS, GeometryPipelineStage.FUNCTION_SIGNATURE_SET_DYNAMIC_VARYING, ShaderDestination.VERTEX);
    shaderBuilder.addFunction(GeometryPipelineStage.FUNCTION_ID_SET_DYNAMIC_VARYING_FS, GeometryPipelineStage.FUNCTION_SIGNATURE_SET_DYNAMIC_VARYING, ShaderDestination.FRAGMENT);

    const instanced = defined(renderResources.runtimeNode.node.instances);

    const length = primitive.attributes.length;
    for (let i = 0; i < length; i++) {
      const attribute = primitive.attributes[i];
      const attributeLocationCount = getAttributeLocationCount(attribute.type);

      const isPositionAttribute = attribute.semantic === VertexAttributeSemantic.POSITION;

      let attributeIndex;
      if (attributeLocationCount > 1) {
        attributeIndex = renderResources.attributeIndex;
        renderResources.attributeIndex = attributeLocationCount;
      } else if (isPositionAttribute) {
        attributeIndex = 0;
      } else {
        attributeIndex = renderResources.attributeIndex++;
      }

      processAttribute(
        renderResources,
        attribute,
        attributeIndex,
        attributeLocationCount,
        // use2D,
        // instanced
      );
    }

    handleBitangents(shaderBuilder, primitive.attributes);

    shaderBuilder.addVertexLines(GeometryStageVS);
    shaderBuilder.addFragmentLines(GeometryStageFS);

  } // process

};

function processAttribute(
  renderResources: PrimitiveRenderResources,
  attribute: Attribute,
  attributeIndex: number,
  attributeLocationCount: number,
) {

  if (attributeLocationCount > 1) {
    // Matrices are stored as multiple attributes, one per column vector.
    addMatrixAttributeToRenderResources(
      renderResources,
      attribute,
      attributeIndex,
      attributeLocationCount
    );
  } else {
    addAttributeToRenderResources(
      renderResources,
      attribute,
      attributeIndex
    );
  }


  const attributeInfo = getAttributeInfo(attribute);
  const shaderBuilder = renderResources.shaderBuilder;

  addAttributeDeclaration(shaderBuilder, attributeInfo);
  addVaryingDeclaration(shaderBuilder, attributeInfo);

  if (defined(attribute.semantic)) {
    addSemanticDefine(shaderBuilder, attribute);
  }

  // Dynamically generate GLSL code for the current attribute.
  updateAttributesStruct(shaderBuilder, attributeInfo);
  updateInitializeAttributesFunction(shaderBuilder, attributeInfo);
  updateSetDynamicVaryingsFunction(shaderBuilder, attributeInfo);
}

function addMatrixAttributeToRenderResources(
  renderResources: PrimitiveRenderResources,
  attribute: Attribute,
  attributeIndex: number,
  attributeLocationCount: number
) {
  
}

function addAttributeToRenderResources(
  renderResources: PrimitiveRenderResources,
  attribute: Attribute,
  attributeIndex: number
) {
  const semantic = attribute.semantic;
  const setIndex = attribute.setIndex;

  // The position attribute should always be in the first index.
  const isPositionAttribute = semantic === VertexAttributeSemantic.POSITION;
  attributeIndex = isPositionAttribute ? 0 : attributeIndex;

  const componentsPerAttribute = getNumberOfComponentsFromAttributeType(attribute.type);

  let constantValue: number[] = undefined;
  if (!defined(attribute.buffer)) {
    if (typeof attribute.constant === 'number') {
      constantValue = [ attribute.constant ];
    } else {
      constantValue = (attribute.constant.constructor as
        (typeof Cartesian2 | typeof Cartesian2 | typeof Cartesian3 | typeof Cartesian4 | typeof Matrix2 | typeof Matrix3 | typeof Matrix4)
      ).pack(attribute.constant as any, []);
    }
  }
  const vertexArrayAttribute: VertexArrayAttribute = {
    index                  : attributeIndex,
    value                  : constantValue,
    vertexBuffer           : attribute.buffer,
    componentsPerAttribute : componentsPerAttribute,
    componentDatatype      : attribute.componentDatatype,
    offsetInBytes          : attribute.byteOffset,
    strideInBytes          : attribute.byteStride,
    normalize              : attribute.normalized,
    count: attribute.count,
  };

  renderResources.attributes.push(vertexArrayAttribute);
}

function addAttributeDeclaration(shaderBuilder: ShaderBuilder, attributeInfo: AttributeInfo) {
  const semantic = attributeInfo.attribute.semantic;
  const glslType = attributeInfo.glslType;
  const variableName = attributeInfo.variableName;
  const attributeName = `a_${variableName}`;

  const isPosition = semantic === VertexAttributeSemantic.POSITION;
  if (isPosition) {
    shaderBuilder.setPositionAttribute(glslType, attributeName);
  } else {
    shaderBuilder.addAttribute(glslType, attributeName);
  }
}

function addVaryingDeclaration(shaderBuilder: ShaderBuilder, attributeInfo: AttributeInfo) {
  const variableName = attributeInfo.variableName;
  let varyingName = `v_${variableName}`;

  let glslType = '';
  if (variableName === 'normalMC') {
    // though the attribute is in model coordinates, the varying is
    // in eye coordinates.
    varyingName = 'v_normalEC';
    glslType = attributeInfo.glslType;
  } else if (variableName === 'tangentMC') {
    // like normalMC, the varying is converted to eye coordinates
    varyingName = 'v_tangentEC';
    // Tangent's glslType is vec4, but in the shader it is split into
    // vec3 tangent and vec3 bitangent
    glslType = 'vec3';
  } else {
    glslType = attributeInfo.glslType;
  }

  shaderBuilder.addVarying(glslType, varyingName);

}

function addSemanticDefine(shaderBuilder: ShaderBuilder, attribute: Attribute) {
  const semantic = attribute.semantic;
  const setIndex = attribute.setIndex;

  switch (semantic) {
    case VertexAttributeSemantic.NORMAL:
      shaderBuilder.addDefine('HAS_NORMALS');
      break;
    case VertexAttributeSemantic.TANGENT:
      shaderBuilder.addDefine('HAS_TANGENTS');
      break;
    case VertexAttributeSemantic.TEXCOORD:
    case VertexAttributeSemantic.COLOR:
      shaderBuilder.addDefine(`HAS_${semantic}_${setIndex}`);
      break;
    case VertexAttributeSemantic.FEATURE_ID:
      // `_FEATURE_ID starts with an underscore so no need to double the underscore.
      shaderBuilder.addDefine(`HAS${semantic}_${setIndex}`);
      break;
    case VertexAttributeSemantic.JOINTS:
      shaderBuilder.addDefine(`HAS_JOINTS`);
      break;
    case VertexAttributeSemantic.WEIGHTS:
      shaderBuilder.addDefine(`HAS_WEIGHTS`);
      break;
    case VertexAttributeSemantic.POSITION:
      shaderBuilder.addDefine(`HAS_POSITION`);
      break;
  }
}

function updateAttributesStruct(shaderBuilder: ShaderBuilder, attributeInfo: AttributeInfo) {
  const vsStructId = GeometryPipelineStage.STRUCT_ID_PROCESSED_ATTRIBUTES_VS;
  const fsStructId = GeometryPipelineStage.STRUCT_ID_PROCESSED_ATTRIBUTES_FS;
  const variableName = attributeInfo.variableName;

  if (variableName === 'tangentMC') {
    // The w component of the tangent is only used for computing the bitangent,
    // so it can be separated from the other tangent components.
    shaderBuilder.addStructField(vsStructId, 'vec3', 'tangentMC');
    shaderBuilder.addStructField(vsStructId, 'float', 'tangentSignMC');
    // The tangent is in model coordinates in the vertex shader
    // but in eye space in the fragment coordinates
    shaderBuilder.addStructField(fsStructId, 'vec3', 'tangentEC');
  } else if (variableName === 'normalMC') {
    // Normals are in model coordinates in the vertex shader but in eye
    // coordinates in the fragment shader
    shaderBuilder.addStructField(vsStructId, 'vec3', 'normalMC');
    shaderBuilder.addStructField(fsStructId, 'vec3', 'normalEC');
  } else {
    shaderBuilder.addStructField(vsStructId, attributeInfo.glslType, variableName);
    shaderBuilder.addStructField(fsStructId, attributeInfo.glslType, variableName);
  }
}

function updateInitializeAttributesFunction(shaderBuilder: ShaderBuilder, attributeInfo: AttributeInfo) {
  const functionId = GeometryPipelineStage.FUNCTION_ID_INITIALIZE_ATTRIBUTES;
  const variableName = attributeInfo.variableName;

  const lines = [];
  if (variableName === 'tangentMC') {
    lines.push('attributes.tangentMC = a_tangentMC.xyz;');
    lines.push('attributes.tangentSignMC = a_tangentMC.w;');
  } else {
    lines.push(`attributes.${variableName} = a_${variableName};`);
  }

  shaderBuilder.addFunctionLines(functionId, lines);
}

function updateSetDynamicVaryingsFunction(shaderBuilder: ShaderBuilder, attributeInfo: AttributeInfo) {
  const semantic = attributeInfo.attribute.semantic;
  const setIndex = attributeInfo.attribute.setIndex;
  if (defined(semantic) && !defined(setIndex)) {
    // positions, normals, and tangents are handled statically in
    // GeometryStageVS
    return;
  }

  const variableName = attributeInfo.variableName;

  // In the vertex shader, we want things like
  // v_texCoord_1 = attributes.texCoord_1;
  const vsFunctionId = GeometryPipelineStage.FUNCTION_ID_SET_DYNAMIC_VARYING_VS;
  const vsLine = `v_${variableName} = attributes.${variableName};`;
  shaderBuilder.addFunctionLines(vsFunctionId, [ vsLine ]);

  // In the fragment shader, we want things like
  // attributes.texCoord_1 = v_texCoord_1;
  const fsFunctionId = GeometryPipelineStage.FUNCTION_ID_SET_DYNAMIC_VARYING_FS;
  const fsLine = `attributes.${variableName} = v_${variableName};`;
  shaderBuilder.addFunctionLines(fsFunctionId, [ fsLine ]);
}

function handleBitangents(shaderBuilder: ShaderBuilder, attributes: Attribute[]) {
  let hasNormals = false;
  let hasTangents = false;
  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    if (attribute.semantic === VertexAttributeSemantic.NORMAL) {
      hasNormals = true;
    } else if (attribute.semantic === VertexAttributeSemantic.TANGENT) {
      hasTangents = true;
    }
  }

  // Bitangents are only defined if we have normals and tangents
  if (!hasNormals || !hasTangents) {
    return;
  }

  shaderBuilder.addDefine('HAS_BITANGENTS');
  shaderBuilder.addVarying('vec3', 'v_bitangentEC');
  shaderBuilder.addStructField(GeometryPipelineStage.STRUCT_ID_PROCESSED_ATTRIBUTES_VS, 'vec3', 'bitangentMC');
  shaderBuilder.addStructField(GeometryPipelineStage.STRUCT_ID_PROCESSED_ATTRIBUTES_FS, 'vec3', 'bitangentEC');
}

export default GeometryPipelineStage;
