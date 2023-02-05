import WebGLConstant from "../core/WebGLConstant";

enum TextureMinificationFilter {
  NEAREST = WebGLConstant.NEAREST,
  LINEAR = WebGLConstant.LINEAR,
  NEAREST_MIPMAP_NEAREST = WebGLConstant.NEAREST_MIPMAP_NEAREST,
  NEAREST_MIPMAP_LINEAR = WebGLConstant.NEAREST_MIPMAP_LINEAR,
  LINEAR_MIPMAP_NEAREST = WebGLConstant.LINEAR_MIPMAP_NEAREST,
  LINEAR_MIPMAP_LINEAR = WebGLConstant.LINEAR_MIPMAP_LINEAR,
}

export default TextureMinificationFilter;
