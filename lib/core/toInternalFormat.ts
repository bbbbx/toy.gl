import Context from "../renderer/Context";
import PixelDatatype from "./PixelDatatype";
import PixelFormat from "./PixelFormat";
import PixelInternalFormat from "./PixelInternalFormat";
import WebGLConstants from "./WebGLConstants";

function toInternalFormat(
  pixelFormat: PixelFormat,
  pixelDatatype: PixelDatatype,
  context: Context
) : number {
  // WebGL 1 require internal format to be the same as format
  if (!context.webgl2) {
    return pixelFormat as number;
  }

  if (pixelFormat === PixelFormat.DEPTH_STENCIL) {
    return WebGLConstants.DEPTH24_STENCIL8;
  }

  if (pixelFormat === PixelFormat.DEPTH_COMPONENT) {
    if (pixelDatatype === PixelDatatype.UNSIGNED_SHORT) {
      return WebGLConstants.DEPTH_COMPONENT16;
    } else if (pixelDatatype === PixelDatatype.UNSIGNED_INT) {
      return WebGLConstants.DEPTH_COMPONENT24;
    }
  }

  if (pixelDatatype === PixelDatatype.FLOAT) {
    switch (pixelFormat) {
      case PixelFormat.RGBA:
        return WebGLConstants.RGBA32F;
      case PixelFormat.RGB:
        return WebGLConstants.RGB32F;
      case PixelFormat.RG:
        return WebGLConstants.RG32F;
      case PixelFormat.R:
        return WebGLConstants.R32F;
    }
  }

  if (pixelDatatype === PixelDatatype.HALF_FLOAT) {
    switch (pixelFormat) {
      case PixelFormat.RGBA:
        return WebGLConstants.RGBA16F;
      case PixelFormat.RGB:
        return WebGLConstants.RGB16F;
      case PixelFormat.RG:
        return WebGLConstants.RG16F;
      case PixelFormat.R:
        return WebGLConstants.R16F;
    }
  }

  if (pixelDatatype === PixelDatatype.UNSIGNED_INT_2_10_10_10_REV) {
    return PixelInternalFormat.RGB10_A2;
  }

  return pixelFormat;
}

export default toInternalFormat;
