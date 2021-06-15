
/*
 * @license Copyright (c) 2021, Venus All Rights Reserved.
 * Available via the MIT license.
 */

var ToyGL = (function () {
  'use strict';

  const global$1 = window;

  function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, vertexShaderSource);
    gl.compileShader(vs);
    
    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, fragmentShaderSource);
    gl.compileShader(fs);

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // TODO:
    // for (const attributeName in attributeLocation) {
    //   if (Object.hasOwnProperty.call(attributeLocation, attributeName)) {
    //     const location = attributeLocation[attributeName];
    //     gl.bindAttribLocation(program, location, attributeName);
    //   }
    // }

    gl.linkProgram(program);

    let log = '';
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
        log = gl.getShaderInfoLog(fs);
        console.error('Fragment shader failed to compiled: ' + log);
      }

      if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
        log = gl.getShaderInfoLog(vs);
        console.error('Vertex shader failed to compiled: ' + log);
      }

      log = gl.getProgramInfoLog(program);
      console.error('Shader program link log: ' + log);
      throw new Error(info);
    }

    return program;
  }

  function setCanvasToDisplaySize(canvas) {
    const devicePixelRatio = global$1.devicePixelRatio;
    const width = global$1.innerWidth;
    const height = global$1.innerHeight;
    canvas.width = width * devicePixelRatio; 
    canvas.height = height * devicePixelRatio; 
    canvas.style.setProperty('width', width + 'px');
    canvas.style.setProperty('height', height + 'px');
  }

  function validateStencilFunc(func) {
    func = func.toUpperCase();
    if (func === 'NEVER' ||
      func === 'ALWAYS' ||
      func === 'LESS' ||
      func === 'LEQUAL' ||
      func === 'NOTEQUAL' ||
      func === 'EQUAL' ||
      func === 'GREATER' ||
      func === 'GEQUAL'
    ) {
      return true;
    }
    return false;
  }

  function validateStencilOp(op) {
    op = op.toUpperCase();
    if (op === 'KEEP' ||
      op === 'ZERO' ||
      op === 'REPLACE' ||
      op === 'INCR' ||
      op === 'DECR' ||
      op === 'INVERT' ||
      op === 'INCR_WRAP' ||
      op === 'DECR_WRAP'
    ) {
      return true;
    }
    return false;
  }

  function defaultValue(a, b) {
    if (a === null || a === undefined) {
      return b;
    }
    return a;
  }

  defaultValue.EMPTY_OBJECT = Object.freeze({});

  const global = window;

  /**
   * Create an instance of WebGLRenderingContext or WebGL2RenderingContext.
   * @param {Object} contextOptions 
   * @param {Boolean} contextOptions.alpha 
   * @param {Boolean} contextOptions.depth 
   * @param {Boolean} contextOptions.stencil 
   * @param {Boolean} contextOptions.antialias 
   * @param {Boolean} contextOptions.preserveDrawingBuffer 
   * @param {Boolean} contextOptions.premultipliedAlpha 
   * @param {Boolean} contextOptions.requireWebgl2 
   * @returns 
   */
  function createContext(contextOptions) {
    contextOptions = defaultValue(contextOptions, defaultValue.EMPTY_OBJECT);

    const canvas = global.document.createElement('canvas');
    let gl;

    if (contextOptions.requireWebgl2) {
      gl = canvas.getContext('webgl2', contextOptions);
    } else {
      gl = canvas.getContext('webgl', contextOptions);
    }

    canvas.style.setProperty('display', 'block');
    setCanvasToDisplaySize(gl.canvas);
    return gl;
  }

  function defined(a) {
    return a !== null && a !== undefined;
  }

  function setState(gl, state) {
    const { depthTest, stencilTest, colorMask, cull, blend, viewport, scissor } = state;

    if (cull) {
      if (cull.enable) {
        gl.enable(gl.CULL_FACE);
      } else {
        gl.disable(gl.CULL_FACE);
      }

      let face = cull.face && cull.face.toUpperCase();
      if (face && (face === 'BACK' || face === 'FRONT' || face === 'FRONT_AND_BACK')) {
        gl.cullFace(gl[face]);
      }
    }

    if (depthTest) {
      if (depthTest.enable === true) {
        gl.enable(gl.DEPTH_TEST);
      } else if (depthTest.enable === false) {
        gl.disable(gl.DEPTH_TEST);
      }

      if (depthTest.func) {
        const func = depthTest.func.toUpperCase();
        gl.depthFunc(gl[func]);
      }

      if (depthTest.write === true) {
        gl.depthMask(true);
      } else if (depthTest.write === false) {
        gl.depthMask(false);
      }
    }

    if (stencilTest) {
      if (stencilTest.enable === true) {
        gl.enable(gl.STENCIL_TEST);
      } else if (stencilTest.enable === false) {
        gl.disable(gl.STENCIL_TEST);
      }

      if (defined(stencilTest.writeMask)) {
        gl.stencilMask(stencilTest.writeMask);
        // gl.stencilMaskSeparate(face, mask);
      }

      if (defined(stencilTest.func) &&
        defined(stencilTest.ref) &&
        defined(stencilTest.readMask)
      ) {
        if (validateStencilFunc(stencilTest.func) === false) {
          throw new Error('setState: stencil func is invalid, current is ' + stencilTest.func + '!');
        }
        const func = stencilTest.func.toUpperCase();
        gl.stencilFunc(gl[func], stencilTest.ref, stencilTest.readMask);
        // gl.stencilFuncSeparate(face, func, ref, mask)
      }

      if (defined(stencilTest.fail) &&
        defined(stencilTest.zfail) &&
        defined(stencilTest.zpass)
      ) {
        if (validateStencilOp(stencilTest.fail) === false ||
          validateStencilOp(stencilTest.zfail) === false ||
          validateStencilOp(stencilTest.zpass) === false
        ) {
          throw new Error('setState: stencil op is invalid!');
        }
        const fail = stencilTest.fail.toUpperCase();
        const zfail = stencilTest.zfail.toUpperCase();
        const zpass = stencilTest.zpass.toUpperCase();
        gl.stencilOp(gl[fail], gl[zfail], gl[zpass]);
        // gl.stencilOpSeparate(face, fail, zfail, zpass)
      }
    }

    if (colorMask) {
      gl.colorMask(colorMask[0], colorMask[1], colorMask[2], colorMask[3]);
    }

    if (blend) {
      if (blend.enable === true) {
        gl.enable(gl.BLEND);
      } else if (blend.enable === false) {
        gl.disable(gl.BLEND);
      }

      if (blend.blendColor) {
        gl.blendColor(...blend.blendColor);
      }

      if (blend.blendEquation) {
        gl.blendEquation(gl[blend.blendEquation.toUpperCase()]);
        // gl.blendEquation(modeRGB, modeAlpha)
      }

      if (blend.blendFunc) {
        const src = blend.blendFunc[0].toUpperCase();
        const dst = blend.blendFunc[1].toUpperCase();
        gl.blendFunc(gl[src], gl[dst]);
        // gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha)
      }
    }

    if (viewport) {
      gl.viewport(viewport[0], viewport[1], viewport[2], viewport[3]);
    }

    if (scissor) {
      if (scissor.enable === true) {
        gl.enable(gl.SCISSOR_TEST);
      } else if (scissor.enable === false) {
        gl.disable(gl.SCISSOR_TEST);
      }
      const rect = scissor.rect;
      if (rect) {
        gl.scissor(rect[0], rect[1], rect[2], rect[3]);
      }
    }
  }

  const FRAMEBUFFER_STATUS = {
    36053: 'FRAMEBUFFER_COMPLETE',
    36054: 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT',
    36055: 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT',
    36057: 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS',
    36061: 'FRAMEBUFFER_UNSUPPORTED',
  };

  function createFramebuffer(gl, options) {
    const { colorTexture, depthTexture, depthRenderbuffer } = options;

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    // color
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);

    // depth
    if (depthTexture) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, depthTexture);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
    }
    else if (depthRenderbuffer) {
      const renderbuffer = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, depthRenderbuffer.width, depthRenderbuffer.height);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    }

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('createFramebuffer: framebuffer combination is NOT completed! Current status is ' + FRAMEBUFFER_STATUS[status] + '.');
    }

    return fb;
  }

  function isPowerOfTwo(value) {
    return (value & (value - 1)) === 0;
  }

  function createTexture(gl, options) {
    const { level, internalFormat, type, format, width, height, data, wrapS, wrapT, minFilter, magFilter, generateMipmap } = options;
    const texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const border = 0;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data);

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
    ];
    
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

    return texture;
  }

  /**
   * Execute a clear command.
   * @param {WebGLRenderingContext} gl 
   * @param {Object} [options] 
   * @param {Array} [options.color] 
   * @param {Number} [options.depth] 
   * @param {Number} [options.stencil] 
   * @param {WebGLFramebuffer} [options.fb] 
   */
  function clear(gl, options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);
    const { fb, color, depth, stencil } = options;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

    let mask = 0;
    if (color) {
      gl.clearColor(color[0], color[1], color[2], color[3]);
      mask |= gl.COLOR_BUFFER_BIT;
    }
    if (defined(depth)) {
      gl.clearDepth(depth);
      mask |= gl.DEPTH_BUFFER_BIT;
    }
    if (stencil) {
      gl.clearStencil(stencil);
      mask |= gl.STENCIL_BUFFER_BIT;
    }

    if (mask !== 0) {
      gl.clear(mask);
    }
  }

  // see https://stackoverflow.com/questions/24048547/checking-if-an-object-is-array-like
  function isArrayLike(item) {
    return (
      Array.isArray(item) || 
      (!!item &&
        typeof item === "object" &&
        typeof (item.length) === "number" && 
        (item.length === 0 ||
          (item.length > 0 && 
          (item.length - 1) in item)
        )
      )
    );
  }

  const cachedProgram = {};
  const cachedBuffer = {};
  const cachedTextures = {};

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
  }
  function createIndicesBuffer(gl, typedArray, usage) {
    const buffer = gl.createBuffer();
    usage = defaultValue(usage, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, typedArray, usage);
    return buffer;
  }
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
    setCanvasToDisplaySize(gl.canvas);

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
      const uniformName = activeUniform.name;
      
      if (Object.hasOwnProperty.call(uniforms, uniformName)) {
        const uniform = uniforms[uniformName];
        const uniformLocation = gl.getUniformLocation(program, uniformName);

        if (uniformLocation === null) {
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

              if (isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

                gl.generateMipmap(gl.TEXTURE_2D);
              }
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

  }

  const ToyGL = {
    createContext,
    setState,
    clear,
    draw,
    createTexture,
    createCubeMap,
    createFramebuffer,
  };

  return ToyGL;

}());
