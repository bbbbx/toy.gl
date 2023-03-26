import MMath from "../math/Math";

function resizeImageToNextPowerOfTwo(image: ImageBitmap | HTMLImageElement | HTMLCanvasElement) {
  const canvas = document.createElement('canvas');
  canvas.width = MMath.nextPowerOfTwo(image.width);
  canvas.height = MMath.nextPowerOfTwo(image.height);
  const context2D = canvas.getContext('2d');
  context2D.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export default resizeImageToNextPowerOfTwo;
