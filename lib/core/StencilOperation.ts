import WebGLConstants from "./WebGLConstants";

/**
 * @public
 */
enum StencilOperation {
  ZERO = WebGLConstants.ZERO,
  KEEP = WebGLConstants.KEEP,
  REPLACE = WebGLConstants.REPLACE,
  INCREMENT = WebGLConstants.INCR,
  DECREMENT = WebGLConstants.DECR,
  INVERT = WebGLConstants.INVERT,
  INCREMENT_WRAP = WebGLConstants.INCR_WRAP,
  DECREMENT_WRAP = WebGLConstants.DECR_WRAP,
}

export default StencilOperation;
