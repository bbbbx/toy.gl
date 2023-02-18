import ComponentDatatype from "../core/ComponentDatatype";
import Buffer from "./Buffer";

/**
 * @internal
 */
interface Attribute {
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
}

export {
  Attribute,
};
