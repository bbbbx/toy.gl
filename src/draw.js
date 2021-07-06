import isArrayLike from './isArrayLike.js';
import defaultValue from './defaultValue.js';
import {
  createProgram,
} from './glUtils.js';

const cachedProgram = {};
const cachedBuffer = {};
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
      console.warn('无法识别 attribute ' + name + ' 的类型：' + type);
  }

  return s;
}

function isArrayBufferView(value) {
  return value instanceof Float32Array ||
         value instanceof Uint8Array ||
         value instanceof Uint16Array ||
         value instanceof Uint32Array ||
         value instanceof Int8Array ||
         value instanceof Int16Array ||
         value instanceof Int32Array;

}

function createAttributeBuffer(gl, typedArray, usage) {
  const buffer = gl.createBuffer();
  usage = defaultValue(usage, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, typedArray, usage);
  return buffer;
};

function createIndicesBuffer(gl, typedArray, usage) {
  const buffer = gl.createBuffer();
  usage = defaultValue(usage, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typedArray, usage);
  return buffer;
};

function draw(gl, options) {
  const { attributes, indices, vs: vsSource, fs: fsSource, count, fb } = options;
  const primitiveType = defaultValue(options.primitiveType, gl.TRIANGLES);
  const uniforms = defaultValue(options.uniforms, defaultValue.EMPTY_OBJECT);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  const key = vsSource + fsSource;
  let program = cachedProgram[key];
  if (!program) {
    program = createProgram(gl, vsSource, fsSource);
    cachedProgram[key] = program;
  }

  gl.useProgram(program);

  // attributes
  const numberOfAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (let i = 0; i < numberOfAttributes; i++) {
    const activeAttribute = gl.getActiveAttrib(program, i);
    const attributeName = activeAttribute.name;

    if (Object.hasOwnProperty.call(attributes, attributeName)) {
      const attribute = attributes[attributeName];
      const attribLocation = gl.getAttribLocation(program, attributeName);

      if (attribLocation === -1) {
        continue;
      }

      const key = attribute.toString();
      let buffer = cachedBuffer[key];
      const size = getAttributeSize(activeAttribute);
      if (Array.isArray(attribute)) {
        // const isInteger = Number.isInteger(attribute[0]);
        // const typedArray = isInteger ? Uint32Array : Float32Array;
        const typedArray = Float32Array;
        if (!buffer) {
          buffer = createAttributeBuffer(gl, new typedArray(attribute));
          cachedBuffer[key] = buffer;
        }

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
      } else if (isArrayBufferView(attribute)) {
        if (!buffer) {
          buffer = createAttributeBuffer(gl, attribute);
          cachedBuffer[key] = buffer;
        }

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

      // gl.useProgram(program);

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
    let max = Number.MIN_SAFE_INTEGER;
    for (const index of indices) {
      max = Math.max(index, max);
    }
    let type, typedArray;
    if (max <= 255) {
      type = gl.UNSIGNED_BYTE;
      typedArray = Uint8Array;
    } else if (max <= 65535) {
      type = gl.UNSIGNED_SHORT;
      typedArray = Uint16Array;
    } else {
      type = gl.UNSIGNED_INT;
      typedArray = Uint32Array;
      gl.getExtension('OES_element_index_unit');
    }

    const key = indices.toString();
    let buffer = cachedBuffer[key];
    if (!buffer) {
      buffer = createIndicesBuffer(gl, new typedArray(indices));
      cachedBuffer[key] = buffer;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.drawElements(primitiveType, count, type, 0);
  } else {
    gl.drawArrays(primitiveType, 0, count);
  }

};

export default draw;
