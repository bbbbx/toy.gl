import isPowerOfTwo from './isPowerOfTwo.js';
import defined from './defined.js';
import defaultValue from './defaultValue.js';

/**
 * Create a WebGLTexture.
 *
 * @param {WebGLRenderingContext} gl 
 * @param {Object} options 
 * @param {Array.<ArrayBufferView | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement>} options.levels all levels data
 * @param {ArrayBufferView | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement} options.data level 0 data
 * @param {Number} options.width
 * @param {Number} options.height
 * @param {Number} [options.depth=1]
 * @param {Number} options.internalFormat For WebGL1, internal format must same with format.
 * @param {Number} options.format
 * @param {Number} options.type Texel data type, such as <code>gl.UNSIGNED_BYTE</code>, <code>gl.FLOAT</code>, <code>gl.UNSIGNED_INT</code>.
 * @param {Number} [options.target=TEXTURE_2D]
 * @param {Boolean} [options.generateMipmap=false]
 * @param {Number} [options.wrapS=CLAMP_TO_EDGE]
 * @param {Number} [options.wrapT=CLAMP_TO_EDGE]
 * @param {Number} [options.wrapR=CLAMP_TO_EDGE]
 * @param {Number} [options.minFilter=LINEAR]
 * @param {Number} [options.magFilter=LINEAR]
 * @param {Number} [options.flipY=false] Only valid for DOM-Element uploads
 * @param {Number} [options.premultiplyAlpha=false] Only valid for DOM-Element uploads
 * @returns {WebGLTexture}
 */
function createTexture(gl, options) {
  const { internalFormat, type, format, width, height, data, generateMipmap } = options;

  const depth = defaultValue(options.depth, 1);
  const wrapS = defaultValue(options.wrapS, gl.CLAMP_TO_EDGE);
  const wrapT = defaultValue(options.wrapT, gl.CLAMP_TO_EDGE);
  const wrapR = defaultValue(options.wrapR, gl.CLAMP_TO_EDGE);
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
  const textureTarget = defaultValue(options.target, gl.TEXTURE_2D);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(textureTarget, texture);


  if (type === gl.FLOAT) {
    if (gl instanceof WebGLRenderingContext && !gl._textureFloat) {
      console.warn('Do not support float texture.');
    }

    if ((minFilter === gl.LINEAR ||
      minFilter === gl.LINEAR_MIPMAP_NEAREST ||
      minFilter === gl.NEAREST_MIPMAP_LINEAR ||
      minFilter === gl.LINEAR_MIPMAP_LINEAR) && !gl._textureFloatLinear
    ) {
      console.warn('Do not support float texture linear filter.');
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
      if (textureTarget === gl.TEXTURE_2D) {
        gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, levelData);
      } else if (textureTarget === gl.TEXTURE_3D) {
        // TODO:
      }

    } else {
      const border = 0;
      if (textureTarget === gl.TEXTURE_2D) {
        // For WebGL1, internal format must be same with format!
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, levelData);
      } else if (textureTarget === gl.TEXTURE_3D) {
        gl.texImage3D(gl.TEXTURE_3D, level, internalFormat, width, height, depth, border, format, type, levelData);
        gl.texParameteri(textureTarget, gl.TEXTURE_WRAP_R, wrapR);
      }
    }
  }

  gl.texParameteri(textureTarget, gl.TEXTURE_WRAP_S, wrapS);
  gl.texParameteri(textureTarget, gl.TEXTURE_WRAP_T, wrapT);
  gl.texParameteri(textureTarget, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(textureTarget, gl.TEXTURE_MAG_FILTER, magFilter);

  if (generateMipmap === true) {
    if ((isPowerOfTwo(width) && isPowerOfTwo(height)) || gl instanceof WebGL2RenderingContext) {
      gl.generateMipmap(textureTarget);
    } else {
      console.warn('createTexture: texture size is NOT power of two, current is ' + width + 'x' + height + '.');
    }
  }

  gl.bindTexture(textureTarget, null);

  return texture;
}

export default createTexture;
