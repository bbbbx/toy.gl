import isPowerOfTwo from './isPowerOfTwo.js';
import defined from './defined.js';
import defaultValue from './defaultValue.js';

/**
 * Create a WebGLTexture.
 * @memberof ToyGL
 * @param {WebGLRenderingContext} gl 
 * @param {Object} options 
 * @param {Array.<ArrayBufferView | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement>} options.levels all levels data
 * @param {ArrayBufferView | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement} options.data level 0 data
 * @param {Number} options.width
 * @param {Number} options.height
 * @param {Number} options.internalFormat For WebGL1, internal format must same with format.
 * @param {Number} options.format
 * @param {Number} options.type Texel data type, such as <code>gl.UNSIGNED_BYTE</code>, <code>gl.FLOAT</code>, <code>gl.UNSIGNED_INT</code>.
 * @param {Boolean} [options.generateMipmap=false]
 * @param {Number} [options.wrapS=CLAMP_TO_EDGE]
 * @param {Number} [options.wrapT=CLAMP_TO_EDGE]
 * @param {Number} [options.minFilter=LINEAR]
 * @param {Number} [options.magFilter=LINEAR]
 * @param {Number} [options.flipY=false] Only valid for DOM-Element uploads
 * @param {Number} [options.premultiplyAlpha=false] Only valid for DOM-Element uploads
 * @returns {WebGLTexture}
 */
function createTexture(gl, options) {
  const { internalFormat, type, format, width, height, data, generateMipmap } = options;

  const wrapS = defaultValue(options.wrapS, gl.CLAMP_TO_EDGE);
  const wrapT = defaultValue(options.wrapT, gl.CLAMP_TO_EDGE);
  const minFilter = defaultValue(options.minFilter, gl.LINEAR);
  const magFilter = defaultValue(options.magFilter, gl.LINEAR);

  let levels = options.levels;
  if (!levels) {
    levels = [ data ];
  }

  const flipY = defaultValue(options.flipY, false);
  const premultiplyAlpha = defaultValue(options.premultiplyAlpha, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiplyAlpha);

  const texture = gl.createTexture();

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (internalFormat === gl.DEPTH_COMPONENT || gl.DEPTH_STENCIL) {
    gl.getExtension('WEBGL_depth_texture');
  }

  if (type === gl.FLOAT) {
    gl.getExtension('OES_texture_float');
    if (minFilter === gl.LINEAR ||
      minFilter === gl.LINEAR_MIPMAP_NEAREST ||
      minFilter === gl.NEAREST_MIPMAP_LINEAR ||
      minFilter === gl.LINEAR_MIPMAP_LINEAR
      ) {
      gl.getExtension('OES_texture_float_linear');
    }
  }

  const numberOfLevels = levels.length;
  for (let level = 0; level < numberOfLevels; level++) {
    const levelData = levels[level];

    if (
      levelData instanceof HTMLImageElement ||
      levelData instanceof HTMLCanvasElement ||
      levelData instanceof HTMLVideoElement
    ) {
      gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, levelData);
    } else {
      const border = 0;
      gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, levelData);
    }
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);

  if (generateMipmap === true) {
    if (isPowerOfTwo(width) && isPowerOfTwo(height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      console.warn('createTexture: texture size is NOT power of two, current is ' + width + 'x' + height + '.');
    }
  }

  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

export default createTexture;
