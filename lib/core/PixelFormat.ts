import WebGLConstant from "./WebGLConstant";

/**
 * @public
 */
enum PixelFormat {
  RGBA = WebGLConstant.RGBA,
  RGB = WebGLConstant.RGB,
  RG = WebGLConstant.RG,
  R = WebGLConstant.RED,
  ALPHA = WebGLConstant.ALPHA,
  LUMINANCE = WebGLConstant.LUMINANCE,
  LUMINANCE_ALPHA = WebGLConstant.LUMINANCE_ALPHA,
  DEPTH_COMPONENT = WebGLConstant.DEPTH_COMPONENT,
  DEPTH_STENCIL = WebGLConstant.DEPTH_STENCIL,
}

export default PixelFormat;
