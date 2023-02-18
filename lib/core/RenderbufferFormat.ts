import WebGLConstants from "./WebGLConstants";

/**
 * @public
 */
enum RenderbufferFormat {
  // WebGL1
  RGBA4 = WebGLConstants.RGBA4,
  RGB565 = WebGLConstants.RGB565,
  RGB5_A1 = WebGLConstants.RGB5_A1,
  DEPTH_COMPONENT16 = WebGLConstants.DEPTH_COMPONENT16,
  STENCIL_INDEX8 = WebGLConstants.STENCIL_INDEX8,
  DEPTH_STENCIL = WebGLConstants.DEPTH_STENCIL,

  // WEBGL_color_buffer_float extension:
  // RGBA32F_EXT
  // RGB32F_EXT
  // EXT_sRGB extension:
  // SRGB8_ALPHA8_EXT = WebGLConstants.SRGB8_ALPHA8_EXT,

  // WebGL2
  R8 = WebGLConstants.R8,
  R8UI = WebGLConstants.R8UI,
  R8I = WebGLConstants.R8I,
  R16UI = WebGLConstants.R16UI,
  R16I = WebGLConstants.R16I,
  R32UI = WebGLConstants.R32UI,
  R32I = WebGLConstants.R32I,

  RG8 = WebGLConstants.RG8,
  RG8UI = WebGLConstants.RG8UI,
  RG8I = WebGLConstants.RG8I,
  RG16UI = WebGLConstants.RG16UI,
  RG16I = WebGLConstants.RG16I,
  RG32UI = WebGLConstants.RG32UI,
  RG32I = WebGLConstants.RG32I,

  RGB8 = WebGLConstants.RGB8,
  RGBA8 = WebGLConstants.RGBA8,
  SRGB8_ALPHA8 = WebGLConstants.SRGB8_ALPHA8,
  RGB10_A2 = WebGLConstants.RGB10_A2,
  RGBA8UI = WebGLConstants.RGBA8UI,
  RGBA8I = WebGLConstants.RGBA8I,

  RGB10_A2UI = WebGLConstants.RGB10_A2UI,
  RGBA16UI = WebGLConstants.RGBA16UI,
  RGBA16I = WebGLConstants.RGBA16I,
  RGBA32I = WebGLConstants.RGBA32I,
  RGBA32UI = WebGLConstants.RGBA32UI,
  DEPTH_COMPONENT24 = WebGLConstants.DEPTH_COMPONENT24,
  DEPTH_COMPONENT32F = WebGLConstants.DEPTH_COMPONENT32F,
  DEPTH24_STENCIL8 = WebGLConstants.DEPTH24_STENCIL8,
  DEPTH32F_STENCIL8 = WebGLConstants.DEPTH32F_STENCIL8,

  // using a WebGL 2 context and the EXT_color_buffer_float extension:
  R16F = WebGLConstants.R16F,
  RG16F = WebGLConstants.RG16F,
  RGBA16F = WebGLConstants.RGBA16F,
  R32F = WebGLConstants.R32F,
  RG32F = WebGLConstants.RG32F,
  RGBA32F = WebGLConstants.RGBA32F,
  R11F_G11F_B10F = WebGLConstants.R11F_G11F_B10F,
}

export default RenderbufferFormat;
