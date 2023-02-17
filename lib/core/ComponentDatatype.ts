import WebGLConstant from "./WebGLConstant";

/**
 * Vertex array attribute component data type.
 * @public
 */
enum ComponentDatatype {
  BYTE = WebGLConstant.BYTE,
  UNSIGNED_BYTE = WebGLConstant.UNSIGNED_BYTE,
  SHORT = WebGLConstant.SHORT,
  UNSIGNED_SHORT = WebGLConstant.UNSIGNED_SHORT,
  INT = WebGLConstant.INT,
  UNSIGNED_INT = WebGLConstant.UNSIGNED_INT,
  FLOAT = WebGLConstant.FLOAT,
  DOUBLE = WebGLConstant.DOUBLE,
}

export default ComponentDatatype;
