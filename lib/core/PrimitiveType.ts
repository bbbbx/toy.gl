import WebGLConstants from "./WebGLConstants";

/**
 * @public
 */
enum PrimitiveType {
  POINTS = WebGLConstants.POINTS,
  LINES = WebGLConstants.LINES,
  LINE_LOOP = WebGLConstants.LINE_LOOP,
  LINE_STRIP = WebGLConstants.LINE_STRIP,
  TRIANGLES = WebGLConstants.TRIANGLES,
  TRIANGLE_STRIP = WebGLConstants.TRIANGLE_STRIP,
  TRIANGLE_FAN = WebGLConstants.TRIANGLE_FAN,
}

export default PrimitiveType;
