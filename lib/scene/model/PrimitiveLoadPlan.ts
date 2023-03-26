import Context from "../../renderer/Context";
import { Indices, Attribute, Primitive } from "./ModelComponents";

class AttributeLoadPlan {
  attribute: Attribute;
  loadBuffer: boolean;
  loadTypedArray: boolean;

  constructor(attribute: Attribute) {
    this.attribute = attribute;
    this.loadBuffer = false;
    this.loadTypedArray = false;
  }
}

class IndicesLoadPlan {
  indices: Indices;
  loadBuffer: boolean;
  loadTypedArray: boolean;

  constructor(indices: Indices) {
    this.indices = indices;
    this.loadBuffer = false;
    this.loadTypedArray = false;
  }
}

/**
 * @internal
 * Primitives may need post-processing steps after their attributes and indices
 * have loaded, such as generating outlines for the CESIUM_primitive_outline glTF
 * extension. This object tracks what indices and attributes need to be post-processed.
 */
class PrimitiveLoadPlan {
  primitive: Primitive;

  /** A flat list of attributes that needs to be post-processed. */
  attributePlans: AttributeLoadPlan[];
  /** The triangle indices need to be post-processed, if they exist. */
  indicesPlan: IndicesLoadPlan;

  /** Set this true to indicate that the primitive has the CESIUM_primitive_outline extension and needs to be post-processed */
  needsOutlines: boolean;
  /** The outline edge indices from the CESIUM_primitive_outline extension */
  outlineIndices: number[];

  static AttributeLoadPlan = AttributeLoadPlan;
  static IndicesLoadPlan = IndicesLoadPlan;

  /**
   * @param primitive - The primitive to track
   */
  constructor(primitive: Primitive) {
    this.primitive = primitive;
    this.attributePlans = [];
    this.needsOutlines = false;
  }

  postProcess(context: Context) {
    if (this.needsOutlines) {
      // generateOutlines(this);
      // generateBuffers(this, context);
    }
  }
}

export default PrimitiveLoadPlan;
