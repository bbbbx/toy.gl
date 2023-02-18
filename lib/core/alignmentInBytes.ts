import PixelDatatype from "./PixelDatatype";
import PixelFormat from "./PixelFormat";
import textureSizeInBytes from "./textureSizeInBytes";

function alignmentInBytes(
  pixelFormat: PixelFormat,
  pixelDatatype: PixelDatatype,
  width: number
): number {
  const mod = textureSizeInBytes(pixelFormat, pixelDatatype, width, 1) % 4;
  return mod === 0 ? 4 : mod === 2 ? 2 : 1;
};

export default alignmentInBytes;
