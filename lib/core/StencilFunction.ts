import WebGLConstant from "./WebGLConstant";

/**
 * @public
 */
enum StencilFunction {
  NEVER = WebGLConstant.NEVER,
  ALWAYS = WebGLConstant.ALWAYS,
  LESS = WebGLConstant.LESS,
  EQUAL = WebGLConstant.EQUAL,
  NOTEQUAL = WebGLConstant.NOTEQUAL,
  LESS_OR_EQUAL = WebGLConstant.LEQUAL,
  GREATER = WebGLConstant.GREATER,
  GREATER_OR_EQUAL = WebGLConstant.GEQUAL,
}

export default StencilFunction;
