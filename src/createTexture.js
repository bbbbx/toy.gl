import isPowerOfTwo from './isPowerOfTwo.js';
import defined from './defined.js';

function createTexture(gl, options) {
  const { level, internalFormat, type, format, width, height, data, wrapS, wrapT, minFilter, magFilter, generateMipmap } = options;
  const texture = gl.createTexture();

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (
    data instanceof HTMLImageElement ||
    data instanceof HTMLCanvasElement ||
    data instanceof HTMLVideoElement
  ) {
    gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
  } else {
    const border = 0;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data);
  }

  // default texture settings
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  if (defined(wrapS)) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  }
  if (defined(wrapT)) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  }
  if (defined(minFilter)) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  }
  if (defined(magFilter)) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
  }

  if (generateMipmap === true) {
    if (isPowerOfTwo(width) && isPowerOfTwo(height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      console.warn('createTexture: texture size is NOT power of two, current is ' + width + 'x' + height + '.');
    }
  }

  return texture;
}

export default createTexture;
