import defaultValue from './defaultValue.js';

function createCubeMap(gl, options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const level = defaultValue(options.level, 0);
  const data = options.data;
  const width = options.width;
  const height = options.height;
  const format = defaultValue(options.format, gl.RGBA);
  const type = defaultValue(options.type, gl.UNSIGNED_BYTE);
  const internalFormat = defaultValue(options.internalFormat, gl.RGBA);

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
  ]
  
  for (let i = 0; i < 6; i++) {
    const face = faces[i];
    const target = face.target;
    const bufferView = face.data;
    if (bufferView instanceof HTMLImageElement) {
      gl.texImage2D(target, level, internalFormat, format, type, bufferView);
    } else {
      gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, bufferView);
    }

    // default texture settings
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

  return texture;
}

export default createCubeMap;
