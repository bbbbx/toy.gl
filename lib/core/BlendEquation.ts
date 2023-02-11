import WebGLConstant from "./WebGLConstant";

enum BlendEquation {
  ADD = WebGLConstant.FUNC_ADD,
  SUBTRACT = WebGLConstant.FUNC_SUBTRACT,
  REVERSE_SUBTRACT = WebGLConstant.FUNC_REVERSE_SUBTRACT,
  MIN = WebGLConstant.MIN,
  MAX = WebGLConstant.MAX,
}

export default BlendEquation;
