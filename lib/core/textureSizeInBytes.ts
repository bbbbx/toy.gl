import PixelDatatype from "./PixelDatatype";
import PixelFormat from "./PixelFormat";
import getComponentsLength from "./getComponentsLength";
import getSizeInBytes from "./getSizeInBytes";

function isPacked(pixelDatatype: PixelDatatype): boolean {
  return (
    pixelDatatype === PixelDatatype.UNSIGNED_INT_24_8 ||
    pixelDatatype === PixelDatatype.UNSIGNED_SHORT_4_4_4_4 ||
    pixelDatatype === PixelDatatype.UNSIGNED_SHORT_5_5_5_1 ||
    pixelDatatype === PixelDatatype.UNSIGNED_SHORT_5_6_5
  );
}

function textureSizeInBytes(
  pixelFormat: PixelFormat,
  pixelDatatype: PixelDatatype,
  width: number,
  height: number
): number {
  let componentsLength = getComponentsLength(pixelFormat);
  if (isPacked(pixelDatatype)) {
    componentsLength = 1;
  }
  return componentsLength * getSizeInBytes(pixelDatatype) * width * height;
}

export default textureSizeInBytes;
