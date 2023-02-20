import WebGLConstants from "./WebGLConstants";

/**
 * Vertex array attribute component data type, see {@link VertexArray}.
 * @public
 */
enum ComponentDatatype {
  BYTE = WebGLConstants.BYTE,
  UNSIGNED_BYTE = WebGLConstants.UNSIGNED_BYTE,
  SHORT = WebGLConstants.SHORT,
  UNSIGNED_SHORT = WebGLConstants.UNSIGNED_SHORT,
  INT = WebGLConstants.INT,
  UNSIGNED_INT = WebGLConstants.UNSIGNED_INT,
  FLOAT = WebGLConstants.FLOAT,
  DOUBLE = WebGLConstants.DOUBLE,
}

export default ComponentDatatype;
