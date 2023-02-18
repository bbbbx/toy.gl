import WebGLConstants from "./WebGLConstants";

/**
 * @public
 */
enum BlendEquation {
  ADD = WebGLConstants.FUNC_ADD,
  SUBTRACT = WebGLConstants.FUNC_SUBTRACT,
  REVERSE_SUBTRACT = WebGLConstants.FUNC_REVERSE_SUBTRACT,
  MIN = WebGLConstants.MIN,
  MAX = WebGLConstants.MAX,
}

export default BlendEquation;
