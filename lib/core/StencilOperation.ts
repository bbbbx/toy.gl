import WebGLConstant from "./WebGLConstant";

enum StencilOperation {
  ZERO = WebGLConstant.ZERO,
  KEEP = WebGLConstant.KEEP,
  REPLACE = WebGLConstant.REPLACE,
  INCREMENT = WebGLConstant.INCR,
  DECREMENT = WebGLConstant.DECR,
  INVERT = WebGLConstant.INVERT,
  INCREMENT_WRAP = WebGLConstant.INCR_WRAP,
  DECREMENT_WRAP = WebGLConstant.DECR_WRAP,
}

export default StencilOperation;
