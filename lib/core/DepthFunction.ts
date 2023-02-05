import WebGLConstant from "./WebGLConstant";

enum DepthFunction {
  LESS = WebGLConstant.LESS,
  EQUAL = WebGLConstant.EQUAL,
  LESS_OR_EQUAL = WebGLConstant.LEQUAL,
  GREATER = WebGLConstant.GREATER,
  GREATER_OR_EQUAL = WebGLConstant.GEQUAL,
  NOT_EQUAL = WebGLConstant.NOTEQUAL,
  NEVER = WebGLConstant.NEVER,
  ALWAYS = WebGLConstant.ALWAYS,
}

export default DepthFunction;
