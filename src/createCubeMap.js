import defaultValue from './defaultValue.js';

/**
 * 
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl 
 * @param {Object} options 
 * @param {Number} [options.level=0]
 * @param {Object} options.data
 * @param {ArrayBufferView|HTMLImageElement|HTMLCanvasElement} [options.data.px]
 * @param {ArrayBufferView|HTMLImageElement|HTMLCanvasElement} [options.data.nx]
 * @param {ArrayBufferView|HTMLImageElement|HTMLCanvasElement} [options.data.py]
 * @param {ArrayBufferView|HTMLImageElement|HTMLCanvasElement} [options.data.ny]
 * @param {ArrayBufferView|HTMLImageElement|HTMLCanvasElement} [options.data.pz]
 * @param {ArrayBufferView|HTMLImageElement|HTMLCanvasElement} [options.data.nz]
 * @param {Number} options.width
 * @param {Number} options.height
 * @param {Number} [options.format=RGBA]
 * @param {Number} [options.type=UNSIGNED_BYTE]
 * @param {Number} [options.internalFormat=RGBA]
 * @param {Number} [options.wrapS=CLAMP_TO_EDGE]
 * @param {Number} [options.wrapT=CLAMP_TO_EDGE]
 * @param {Number} [options.minFilter=LINEAR]
 * @param {Number} [options.magFilter=LINEAR]
 * @returns {WebGLTexture}
 */
function createCubeMap(gl, options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const level = defaultValue(options.level, 0);
  const data = options.data;
  const width = options.width;
  const height = options.height;
  const format = defaultValue(options.format, gl.RGBA);
  const type = defaultValue(options.type, gl.UNSIGNED_BYTE);
  const internalFormat = defaultValue(options.internalFormat, gl.RGBA);
  const wrapS = defaultValue(options.wrapS, gl.CLAMP_TO_EDGE);
  const wrapT = defaultValue(options.wrapT, gl.CLAMP_TO_EDGE);
  const minFilter = defaultValue(options.minFilter, gl.LINEAR);
  const magFilter = defaultValue(options.magFilter, gl.LINEAR);

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faces = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      data: data.px,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      data: data.nx,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      data: data.py,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      data: data.ny,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      data: data.pz,
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      data: data.nz,
    },
  ];

  for (let i = 0; i < 6; i++) {
    const face = faces[i];
    const target = face.target;
    const bufferView = face.data;
    if (bufferView instanceof HTMLImageElement || bufferView instanceof HTMLCanvasElement) {
      gl.texImage2D(target, level, internalFormat, format, type, bufferView);
    } else {
      gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, bufferView);
    }

    // default texture settings
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, wrapS);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, wrapT);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, magFilter);
  }

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

  return texture;
}

export default createCubeMap;
