import PixelDatatype from "./PixelDatatype";
import PixelFormat from "./PixelFormat";
import getSizeInBytes from "./getSizeInBytes";
import getComponentsLength from "./getComponentsLength";

function createTypedArray(
  pixelFormat: PixelFormat,
  pixelDatatype: PixelDatatype,
  width: number,
  height: number
): ArrayBufferView {
  let Constructor;
  const sizeInBytes = getSizeInBytes(pixelDatatype);
  if (sizeInBytes === Uint8Array.BYTES_PER_ELEMENT) {
    Constructor = Uint8Array;
  } else if (sizeInBytes === Uint16Array.BYTES_PER_ELEMENT) {
    Constructor = Uint16Array;
  } else if (sizeInBytes === Float32Array.BYTES_PER_ELEMENT && pixelDatatype === PixelDatatype.FLOAT) {
    Constructor = Float32Array;
  } else {
    Constructor = Uint32Array;
  }

  const size = getComponentsLength(pixelFormat) * width * height;
  return new Constructor(size);
}

export default createTypedArray;
