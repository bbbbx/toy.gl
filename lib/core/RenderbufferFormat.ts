import WebGLConstant from "./WebGLConstant";

enum RenderbufferFormat {
  RGBA4 = WebGLConstant.RGBA4,
  RGBA8 = WebGLConstant.RGBA8,
  RGBA16F = WebGLConstant.RGBA16F,
  RGBA32F = WebGLConstant.RGBA32F,
  RGB5_A1 = WebGLConstant.RGB5_A1,
  RGB565 = WebGLConstant.RGB565,
  DEPTH_COMPONENT16 = WebGLConstant.DEPTH_COMPONENT16,
  // DEPTH_COMPONENT24 = WebGLConstant.DEPTH_COMPONENT24,
  STENCIL_INDEX8 = WebGLConstant.STENCIL_INDEX8,
  DEPTH_STENCIL = WebGLConstant.DEPTH_STENCIL,
  DEPTH24_STENCIL8 = WebGLConstant.DEPTH24_STENCIL8,
}

export default RenderbufferFormat;
