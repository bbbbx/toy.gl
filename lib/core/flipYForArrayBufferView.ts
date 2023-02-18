import PixelDatatype from "./PixelDatatype";
import PixelFormat from "./PixelFormat";
import createTypedArray from "./createTypedArray";
import getComponentsLength from "./getComponentsLength";

function flipYForArrayBufferView(
  arrayBufferView: ArrayBufferView,
  pixelFormat: PixelFormat,
  pixelDatatype: PixelDatatype,
  width: number,
  height: number
) : ArrayBufferView {
  if (height === 1) {
    return arrayBufferView;
  }

  const flipped = createTypedArray(pixelFormat, pixelDatatype, width, height);
  const numberOfComponents = getComponentsLength(pixelFormat);
  const textureWidth = width * numberOfComponents;
  for (let i = 0; i < height; ++i) {
    const row = i * width * numberOfComponents;
    const flippedRow = (height - i - 1) * width * numberOfComponents;
    for (let j = 0; j < textureWidth; ++j) {
      flipped[flippedRow + j] = arrayBufferView[row + j];
    }
  }

  return flipped;
}

export default flipYForArrayBufferView;
