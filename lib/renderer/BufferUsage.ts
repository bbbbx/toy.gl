import WebGLConstants from "../core/WebGLConstants";

/**
 * @public
 */
enum BufferUsage {
  STATIC_DRAW = WebGLConstants.STATIC_DRAW,
  STREAM_DRAW = WebGLConstants.STREAM_DRAW,
  DYNAMIC_DRAW = WebGLConstants.DYNAMIC_DRAW,
};

export default BufferUsage;
