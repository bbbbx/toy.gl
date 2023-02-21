import PixelFormat from "./PixelFormat";

function isCompressedFormat(pixelFormat: PixelFormat): boolean {
  return (
    pixelFormat === PixelFormat.RGB_DXT1 ||
    pixelFormat === PixelFormat.RGBA_DXT1 ||
    pixelFormat === PixelFormat.RGBA_DXT3 ||
    pixelFormat === PixelFormat.RGBA_DXT5 ||
    pixelFormat === PixelFormat.RGB_PVRTC_4BPPV1 ||
    pixelFormat === PixelFormat.RGB_PVRTC_2BPPV1 ||
    pixelFormat === PixelFormat.RGBA_PVRTC_4BPPV1 ||
    pixelFormat === PixelFormat.RGBA_PVRTC_2BPPV1 ||
    pixelFormat === PixelFormat.RGBA_ASTC ||
    pixelFormat === PixelFormat.RGB_ETC1 ||
    pixelFormat === PixelFormat.RGB8_ETC2 ||
    pixelFormat === PixelFormat.RGBA8_ETC2_EAC ||
    pixelFormat === PixelFormat.RGBA_BC7
  );
}

export default isCompressedFormat;
