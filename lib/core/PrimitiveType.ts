import WebGLConstant from "./WebGLConstant";

enum PrimitiveType {
  POINTS = WebGLConstant.POINTS,
  LINES = WebGLConstant.LINES,
  LINE_LOOP = WebGLConstant.LINE_LOOP,
  LINE_STRIP = WebGLConstant.LINE_STRIP,
  TRIANGLES = WebGLConstant.TRIANGLES,
  TRIANGLE_STRIP = WebGLConstant.TRIANGLE_STRIP,
  TRIANGLE_FAN = WebGLConstant.TRIANGLE_FAN,
}

export default PrimitiveType;
