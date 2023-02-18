import WebGLConstants from "../core/WebGLConstants";

/**
 * @public
 */
enum TextureWrap {
  CLAMP_TO_EDGE = WebGLConstants.CLAMP_TO_EDGE,
  REPEAT = WebGLConstants.REPEAT,
  MIRRORED_REPEAT = WebGLConstants.MIRRORED_REPEAT,
}

export default TextureWrap;
