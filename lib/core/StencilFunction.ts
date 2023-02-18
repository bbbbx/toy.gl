import WebGLConstants from "./WebGLConstants";

/**
 * @public
 */
enum StencilFunction {
  NEVER = WebGLConstants.NEVER,
  ALWAYS = WebGLConstants.ALWAYS,
  LESS = WebGLConstants.LESS,
  EQUAL = WebGLConstants.EQUAL,
  NOTEQUAL = WebGLConstants.NOTEQUAL,
  LESS_OR_EQUAL = WebGLConstants.LEQUAL,
  GREATER = WebGLConstants.GREATER,
  GREATER_OR_EQUAL = WebGLConstants.GEQUAL,
}

export default StencilFunction;
