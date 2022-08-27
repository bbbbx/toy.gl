import isArrayLike from './isArrayLike.js';
import defaultValue from './defaultValue.js';
import {
  createProgram,
} from './glUtils.js';
import defined from './defined.js';
import {
  createIndicesBuffer,
  getIndicesType,
} from './buffer.js';
import createVAO from './createVAO.js';

const cachedProgram = {};
const cachedTextures = {};

function getNumberOfComponentsByType(type) {
  let numberOfComponents = 0;

  switch (type) {
  case 5126: // FLOAT
    numberOfComponents = 1;
    break;
  case 35664: // FLOAT_VEC2
    numberOfComponents = 2;
    break;
  case 35665: // gl.FLOAT_VEC3
    numberOfComponents = 3;
    break;
  case 35666: // FLOAT_VEC4
    numberOfComponents = 4;
    break;
  case 35674: // FLOAT_MAT2
    numberOfComponents = 4;
    break;
  case 35675: // FLOAT_MAT3
    numberOfComponents = 9;
    break;
  case 35676: // FLOAT_MAT4
    numberOfComponents = 16;
    break;
  default:
    throw new Error('Unrecognize ' + type + ' type.');
  }
  return numberOfComponents;
}

function getAttributeSize(activeAttribute) {
  const { name, size, type } = activeAttribute;
  const componentCount = getNumberOfComponentsByType(type);
  return size * componentCount;
}

const vaoCache = {};
function getVaoKey(attributes, indices) {
  let key = '';
  for (const attributeName in attributes) {
    if (Object.hasOwnProperty.call(attributes, attributeName)) {
      const attribute = attributes[attributeName];
      key += attribute.toString();
    }
  }

  if (indices) {
    key += indices.toString();
  }

  return key;
}

/**
 * Execute a draw command.
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl 
 * @param {Object} options 
 * @param {String} options.vs Vertex shader text
 * @param {String} options.fs Fragment shader text
 * @param {Object} [options.attributes] use <code>attributes</code> or <code>vao</code> property.
 * @param {WebGLVertexArrayObjectOES|WebGLVertexArrayObject} [options.vao] @see {@link createVAO}
 * @param {Object} [options.attributeLocations] If you define <code>vao</code> property, in order to correspond to attribute location of VAO, you must specify the location for the vertex attribute of shader program.
 * @param {Object} [options.uniforms] The key of object is uniform name, value can be string(texture image file path), number, Array, ArrayBufferView. Uniform array is supported.
 * @param {Array | Uint8Array | Uint16Array | Uint32Array} [options.indices] Vertex indices, when using an Array, it is treated as Uint16Array, so if the maximum value of indices is greater then 65535, Uint32Array MUST be used.
 * @param {Number} [options.count=indices.length] The number of vertices.
 * @param {Number} [options.primitiveType=gl.TRIANGLES] Primitive type. <code>gl.LINES</code>, <code>gl.POINTS</code>.
 * @param {WebGLFramebuffer | null} [options.fb=null] See {@link createFramebuffer}.
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

    gl.bindVertexArray(vao);

  } else if (defined(attributes)) {
    const vaoKey = getVaoKey(attributes, indices);
    let vao = vaoCache[vaoKey];
    if (!vao) {
      const vaoAttributes = {};
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
          vaoAttributes[attributeName] = {
            location: attribLocation,
            size: size,
            data: attribute,
          };
        }
      }

      vao = createVAO(gl, {
        attributes: vaoAttributes,
        indices: indices,
      });

      vaoCache[vaoKey] = vao;
    }

    gl.bindVertexArray(vao);
  } else {
    throw new Error('vao or attributes must be defined.');
  }

  // uniforms
  const numberOfUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  const maximumTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  let currentTextureUnit = 0;
  for (let i = 0; i < numberOfUniforms; i++) {
    const activeUniform = gl.getActiveUniform(program, i);
    let uniformName = activeUniform.name;
    const type = activeUniform.type;
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
        } else if (activeUniform.type === gl.SAMPLER_3D) {
          gl.bindTexture(gl.TEXTURE_3D, uniform);
        } else if (activeUniform.type === gl.SAMPLER_CUBE) {
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, uniform);
        } else {
          throw new Error(activeUniform, 'type MUST be SAMPLER_2D or SAMPLER_CUBE');
        }

        gl.uniform1i(uniformLocation, currentTextureUnit);
        currentTextureUnit++;
      } else if (type === gl.FLOAT_MAT4) {
        const transpose = false;
        gl.uniformMatrix4fv(uniformLocation, transpose, Array.from(uniform));
      } else if (type === gl.FLOAT_MAT3) {
        gl.uniformMatrix3fv(uniformLocation, transpose, Array.from(uniform));
      } else if (type === gl.FLOAT_MAT2) {
        gl.uniformMatrix2fv(uniformLocation, transpose, Array.from(uniform));
      } else if (type === gl.FLOAT_VEC4) {
        gl.uniform4fv(uniformLocation, Array.from(uniform));
      } else if (type === gl.FLOAT_VEC3) {
        gl.uniform3fv(uniformLocation, Array.from(uniform));
      } else if (type === gl.FLOAT_VEC2) {
        gl.uniform2fv(uniformLocation, Array.from(uniform));
      } else if (type === gl.FLOAT /*typeOfUniform === 'number'*/) {
        gl.uniform1f(uniformLocation, uniform);
      } else if (type === gl.BOOL || type === gl.INT) {
        gl.uniform1i(uniformLocation, uniform);
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
  const hasBoundElementArrayBuffer = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
  if (indices && indices.length > 0) {
    const buffer = createIndicesBuffer(gl, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);

    const indicesType = getIndicesType(indices);
    gl.drawElements(primitiveType, count, indicesType, 0);
  } else if (hasBoundElementArrayBuffer) {
    const indicesType = hasBoundElementArrayBuffer.indicesType;
    gl.drawElements(primitiveType, count, indicesType, 0);
  } else {
    gl.drawArrays(primitiveType, 0, count);
  }
}

export default draw;
