import WebGLConstants from "./WebGLConstants";

/**
 * @public
 */
enum DepthFunction {
  LESS = WebGLConstants.LESS,
  EQUAL = WebGLConstants.EQUAL,
  LESS_OR_EQUAL = WebGLConstants.LEQUAL,
  GREATER = WebGLConstants.GREATER,
  GREATER_OR_EQUAL = WebGLConstants.GEQUAL,
  NOT_EQUAL = WebGLConstants.NOTEQUAL,
  NEVER = WebGLConstants.NEVER,
  ALWAYS = WebGLConstants.ALWAYS,
}

export default DepthFunction;
