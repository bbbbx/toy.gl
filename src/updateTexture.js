import defaultValue from './defaultValue.js';

/**
 * Update texture data.
 * @param {WebGLRenderingContext} gl 
 * @param {WebGLTexture} texture 
 * @param {Object | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement} source 
 * @param {Number} source.width 
 * @param {Number} source.height 
 * @param {TypedArray} source.arrayBufferView 
 * @param {Number} [source.level=0] 
 * @param {Number} [source.internalFormat=gl.RGBA] 
 * @param {Number} [source.format=gl.RGBA] 
 * @param {Number} [source.type=gl.UNSIGNED_BYTE] 
 * @returns {WebGLTexture}
 */
function updateTexture(gl, texture, source) {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (source instanceof HTMLImageElement ||
    source instanceof HTMLCanvasElement ||
    source instanceof HTMLVideoElement) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  } else {

    const { width, height, arrayBufferView } = source;
    const level = defaultValue(source.level, 0);
    const internalFormat = defaultValue(source.internalFormat, gl.RGBA);
    const format = defaultValue(source.format, gl.RGBA);
    const type = defaultValue(source.internalFormat, gl.UNSIGNED_BYTE);
    const border = 0;

    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, arrayBufferView);
  }

  gl.bindTexture(gl.TEXTURE_2D, null);
  return texture;
}

export default updateTexture;
