import CullFace from "../../core/CullFace";
import defaultValue from "../../core/defaultValue";
import defined from "../../core/defined";
import PrimitiveType from "../../core/PrimitiveType";
import Cartesian3 from "../../math/Cartesian3";
import Matrix3 from "../../math/Matrix3";
import Matrix4 from "../../math/Matrix4";
import Quaternion from "../../math/Quaternion";
import Axis from "../Axis";
import { Attribute, Instances, Node, Primitive } from "./ModelComponents";
import VertexAttributeSemantic from "./VertexAttributeSemantic";

function isTriangles(primitiveType: PrimitiveType) : boolean {
  return (
    primitiveType === PrimitiveType.TRIANGLES ||
    primitiveType === PrimitiveType.TRIANGLE_FAN ||
    primitiveType === PrimitiveType.TRIANGLE_STRIP
  );
}

const scratchMatrix3 = new Matrix3();

const cartesianMinScratch = new Cartesian3();
const cartesianMaxScratch = new Cartesian3();

namespace ModelUtility {
  export function getCullFace(modelMatrix: Matrix4, primitiveType: PrimitiveType) : CullFace {
    if (!isTriangles(primitiveType)) {
      return CullFace.BACK;
    }
    const matrix3 = Matrix4.getMatrix3(modelMatrix, scratchMatrix3);
    return Matrix3.determinant(matrix3) < 0.0 ? CullFace.FRONT : CullFace.BACK;
  }

  export function getNodeTransform(node: Node) : Matrix4 {
    if (defined(node.matrix)) {
      return node.matrix;
    }

    return Matrix4.fromTranslationQuaternionRotationScale(
      defaultValue(node.translation, Cartesian3.ZERO),
      defaultValue(node.rotation, Quaternion.IDENTITY),
      defaultValue(node.scale, Cartesian3.ONE),
    );
  }

  /**
   * 
   * @param object 
   * @param semantic 
   * @param setIndex The set index of the semantic. May be undefined for some semantics (POSITION, NORMAL, TRANSLATION, ROTATION, for example)
   */
  export function getAttributeBySemantic(object: Primitive | Instances, semantic: VertexAttributeSemantic, setIndex?: number) : Attribute {
    const attributes = object.attributes;
    const attributesLength = attributes.length;

    for (let i = 0; i < attributesLength; i++) {
      const attribute = attributes[i];
      const matchesSetIndex = defined(setIndex) ? attribute.setIndex === setIndex : true;

      if (attribute.semantic === semantic && matchesSetIndex) {
        return attribute;
      }
    }

    return undefined;
  }

  export function getAxisCorrectionMatrix(upAxis: Axis, forwardAxis: Axis, result = Matrix4.clone(Matrix4.IDENTITY)) : Matrix4 {
    if (upAxis === Axis.Y) {

    } else if (upAxis === Axis.X) {

    }

    if (forwardAxis == Axis.Z) {

    }

    return result;
  }

  export function getPositionMinMax(primitive: Primitive, instancingTranslationMin: Cartesian3, instancingTranslationMax: Cartesian3) {
    const positionGltfAttribute = ModelUtility.getAttributeBySemantic(primitive, VertexAttributeSemantic.POSITION);

    let positionMin = positionGltfAttribute.min as Cartesian3;
    let positionMax = positionGltfAttribute.max as Cartesian3;

    if (defined(instancingTranslationMin) && defined(instancingTranslationMax)) {
      positionMin = Cartesian3.add(positionMin, instancingTranslationMin, cartesianMinScratch);
      positionMax = Cartesian3.add(positionMax, instancingTranslationMax, cartesianMaxScratch);
    }

    return {
      min: positionMin,
      max: positionMax,
    };
  }
}

export default ModelUtility;
