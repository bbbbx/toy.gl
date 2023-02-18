import WebGLConstants from "../core/WebGLConstants";

/**
 * @public
 */
enum TextureMinificationFilter {
  NEAREST = WebGLConstants.NEAREST,
  LINEAR = WebGLConstants.LINEAR,
  NEAREST_MIPMAP_NEAREST = WebGLConstants.NEAREST_MIPMAP_NEAREST,
  NEAREST_MIPMAP_LINEAR = WebGLConstants.NEAREST_MIPMAP_LINEAR,
  LINEAR_MIPMAP_NEAREST = WebGLConstants.LINEAR_MIPMAP_NEAREST,
  LINEAR_MIPMAP_LINEAR = WebGLConstants.LINEAR_MIPMAP_LINEAR,
}

export default TextureMinificationFilter;
