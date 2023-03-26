import DeveloperError from "../core/DeveloperError";
import AttributeType from "./model/AttributeType";

function getNumberOfComponentsFromAttributeType(attributeType: AttributeType) {
  switch (attributeType) {
    case AttributeType.SCALAR:
      return 1;
    case AttributeType.VEC2:
      return 2;
    case AttributeType.VEC3:
      return 3;
    case AttributeType.VEC4:
    case AttributeType.MAT2:
      return 4;
    case AttributeType.MAT3:
      return 9;
    case AttributeType.MAT4:
      return 16;
    default:
      throw new DeveloperError('attributeType is not a valid value');
  }
}

export default getNumberOfComponentsFromAttributeType;
