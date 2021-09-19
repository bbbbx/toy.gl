import isArrayLike from './isArrayLike.js';
import defaultValue from './defaultValue.js';
import {
  createProgram,
} from './glUtils.js';
import defined from './defined.js';
import {
  createAttributeBuffer,
  createIndicesBuffer,
  getIndicesType,
} from './buffer.js';

const cachedProgram = {};
const cachedTextures = {};

function getNumberOfComponentsByType(type) {
  let numberOfComponents = 0;

  switch (type) {
    case 5126: // gl.FLOAT
      numberOfComponents = 1;
      break;
    case 35664: // gl.FLOAT_VEC2
      numberOfComponents = 2;
      break;
    case 35665: // gl.FLOAT_VEC3
      numberOfComponents = 3;
      break;
    case 35666: // gl.FLOAT_VEC4
      numberOfComponents = 4;
      break;
    default:
      throw new Error('Unrecognize ' + type + ' type.');
  }
  return numberOfComponents;
}

function getAttributeSize(activeAttribute) {
  const { name, size, type } = activeAttribute;
  let s = 0;
  switch (type) {
    case 5126: // gl.FLOAT
      s = size * 1;
      break;
    case 35664: // gl.FLOAT_VEC2
      s = 2 * size;
      break;
    case 35665: // gl.FLOAT_VEC3
      s = 3 * size;
      break;
    case 35666: // gl.FLOAT_VEC4
      s = 4 * size;
      break;
    case 35674: // gl.FLOAT_MAT2
      s = 4 * size;
      break;
    case 35675: // gl.FLOAT_MAT3
      s = 9 * size;
      break;
    case 35676: // gl.FLOAT_MAT4
      s = 16 * size;
      break;
    default:
      console.warn(`Can not recognize attribute ${name} type, current type is ${type}`);
  }

  return s;
}

/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {Object} options 
 * @param {String} options.vs
 * @param {String} options.fs
 * @param {Object} [options.attributeLocations]
 * @param {Object} options.attributes 
 * @param {WebGLVertexArrayObject} options.vao
 * @param {Object} options.uniforms 
 * @param {Array | Uint8Array | Uint16Array | Uint32Array} options.indices When using an Array, it is treated as Uint16Array, so if the maximum value of indices is greater then 65535, Uint32Array MUST be used.
 * @param {Number} options.count
 * @param {Number} [options.primitiveType=gl.TRIANGLES]
 * @param {WebGLFramebuffer} [options.fb=null]
 */
function draw(gl, options) {
  const {
    attributes,
    indices,
    vao,
    vs: vsSource,
    fs: fsSource,
    attributeLocations,
    fb
  } = options;

  let count = options.count;
  if (!defined(count) && defined(indices)) {
    count = indices.length;
  }
  if (!defined(count)) {
    throw new Error('vertices count or indices is not defined.');
  }

  if (defined(vao) && !defined(attributeLocations)) {
    throw new Error('To use vao, you must defined attributeLocations.');
  }

  const primitiveType = defaultValue(options.primitiveType, gl.TRIANGLES);
  const uniforms = defaultValue(options.uniforms, defaultValue.EMPTY_OBJECT);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  const key = vsSource + fsSource;
  let program = cachedProgram[key];
  if (!program) {
    program = createProgram(gl, vsSource, fsSource, attributeLocations);
    cachedProgram[key] = program;
  }

  gl.useProgram(program);

  // attributes
  const numberOfAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  if (defined(vao)) {

    const ext = gl.getExtension('OES_vertex_array_object');
    ext.bindVertexArrayOES(vao);

  } else if (defined(attributes)) {

    for (let i = 0; i < numberOfAttributes; i++) {
      const activeAttribute = gl.getActiveAttrib(program, i);
      const attributeName = activeAttribute.name;

      if (Object.hasOwnProperty.call(attributes, attributeName)) {
        const attribute = attributes[attributeName];
        const attribLocation = gl.getAttribLocation(program, attributeName);

        if (attribLocation === -1) {
          continue;
        }

        const size = getAttributeSize(activeAttribute);
        const buffer = createAttributeBuffer(gl, attribute, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(attribLocation);
        gl.vertexAttribPointer(
          attribLocation,
          size,
          gl.FLOAT,
          false,
          0,
          0
        );

      }
    }
  } else {
    throw new Error('vao or attributes must be defined.')
  }

  // uniforms
  const numberOfUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  const maximumTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  let currentTextureUnit = 0;
  for (let i = 0; i < numberOfUniforms; i++) {
    const activeUniform = gl.getActiveUniform(program, i);
    let uniformName = activeUniform.name;
    let isUniformArray = false;

    const indexOfBracket = uniformName.indexOf('[');
    if (indexOfBracket >= 0) {
      // "u_xxx[0]" => "u_xxx"
      uniformName = uniformName.slice(0, indexOfBracket);
      isUniformArray = true;
    }
    
    if (Object.hasOwnProperty.call(uniforms, uniformName)) {
      const uniform = uniforms[uniformName];
      const uniformLocation = gl.getUniformLocation(program, uniformName);

      if (uniformLocation === null) {
        continue;
      }

      // support float, vec[234] uniform array
      if (isUniformArray) {
        const type = activeUniform.type;
        const numberOfComponents = getNumberOfComponentsByType(type);

        gl['uniform' + numberOfComponents + 'fv'](uniformLocation, Array.from(uniform));
        continue;
      }

      const typeOfUniform = typeof uniform;
      const textureUnit = gl.TEXTURE0 + currentTextureUnit;
      if (uniform instanceof WebGLTexture) {
        gl.activeTexture(textureUnit);

        if (activeUniform.type === gl.SAMPLER_2D) {
          gl.bindTexture(gl.TEXTURE_2D, uniform);
        } else if (activeUniform.type === gl.SAMPLER_CUBE) {
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, uniform);
        } else {
          throw new Error(activeUniform, 'type MUST be SAMPLER_2D or SAMPLER_CUBE');
        }

        gl.uniform1i(uniformLocation, currentTextureUnit);
        currentTextureUnit++;
      } else if (isArrayLike(uniform)) {
        const size = uniform.length;
        if (size <= 4) {
          gl['uniform' + size + 'fv' ](uniformLocation, uniform);
        } else if (size <= 16) {
          const order = Math.floor(Math.sqrt(size));
          const transpose = false; // MUST be false
          gl['uniformMatrix' + order + 'fv'](uniformLocation, transpose, Array.from(uniform));
        }
      } else if (typeOfUniform === 'number') {
        gl.uniform1f(uniformLocation, uniform);
      } else if (typeOfUniform === 'string') {

        if (currentTextureUnit > maximumTextureUnits) {
          console.error('texture exceed maximum texture units.');
          continue;
        }

        let texture = cachedTextures[uniform];

        if (!texture) {
          texture = gl.createTexture();
          gl.activeTexture(textureUnit);
          gl.bindTexture(gl.TEXTURE_2D, texture);

          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
          const image = new Image();
          image.src = uniform;
          image.addEventListener('load', () => {
            gl.activeTexture(textureUnit);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          });

          cachedTextures[uniform] = texture;
        }

        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(uniformLocation, currentTextureUnit);

        currentTextureUnit++;
      }
    }
  }

  // draw
  if (indices && indices.length > 0) {
    
    const buffer = createIndicesBuffer(gl, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);

    const indicesType = getIndicesType(indices);
    gl.drawElements(primitiveType, count, indicesType, 0);
  } else {
    gl.drawArrays(primitiveType, 0, count);
  }

};

export default draw;
