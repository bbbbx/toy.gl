import ComponentDatatype from "../core/ComponentDatatype";
import Buffer from "./Buffer";

/**
 * @public
 * Vertex Array Object attribute slot, see {@link VertexArray}.
 */
interface VertexArrayAttribute {
  index?: number,
  enabled?: boolean,
  value?: number[],
  vertexBuffer?: Buffer,
  offsetInBytes?: number,
  strideInBytes?: number,
  componentsPerAttribute: number,
  componentDatatype?: ComponentDatatype,
  normalize?: boolean,
  instanceDivisor?: number,

  count?: number,
}

export {
  VertexArrayAttribute,
};
