
/*
 * @license Copyright (c) 2021, Venus All Rights Reserved.
 * Available via the MIT license.
 */

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
 * @param {HTMLCanvasElement} contextOptions.canvas 
 * @returns 
 */
function createContext(contextOptions) {
  contextOptions = defaultValue(contextOptions, defaultValue.EMPTY_OBJECT);

  let canvas = contextOptions.canvas;
  if (!canvas) {
    canvas = global.document.createElement('canvas');
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.setProperty('display', 'block');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  let gl;
  if (contextOptions.requireWebgl2) {
    gl = canvas.getContext('webgl2', contextOptions);
  } else {
    gl = canvas.getContext('webgl', contextOptions);
  }

  // VAO extension
  if (!gl.createVertexArray) {
    const extVAO = gl.getExtension('OES_vertex_array_object');
    if (extVAO) {
      gl.createVertexArray = extVAO.createVertexArrayOES.bind(extVAO);
      gl.bindVertexArray = extVAO.bindVertexArrayOES.bind(extVAO);
      gl.deleteVertexArray = extVAO.deleteVertexArrayOES.bind(extVAO);
      gl.isVertexArray = extVAO.isVertexArrayOES.bind(extVAO);
      gl.VERTEX_ARRAY_BINDING = extVAO.VERTEX_ARRAY_BINDING_OES;
    }
  }

  // Instanced Array extension
  if (!gl.drawArraysInstanced) {
    const extInstancedArrays = gl.getExtension('ANGLE_instanced_arrays');
    if (extInstancedArrays) {
      gl.drawArraysInstanced = extInstancedArrays.drawArraysInstancedANGLE.bind(extInstancedArrays);
      gl.drawElementsInstanced = extInstancedArrays.drawElementsInstancedANGLE.bind(extInstancedArrays);
      gl.vertexAttribDivisor = extInstancedArrays.vertexAttribDivisorANGLE.bind(extInstancedArrays);
      gl.VERTEX_ATTRIB_ARRAY_DIVISOR = extInstancedArrays.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE;
    }
  }

  // Draw Buffers extension
  if (!gl.drawBuffers) {
    const extDrawBuffers = gl.getExtension('WEBGL_draw_buffers');
    if (extDrawBuffers) {
      gl.drawBuffers = extDrawBuffers.drawBuffersWEBGL.bind(extDrawBuffers);
      for (let i = 1; i <= 15; i++) {
        gl[`COLOR_ATTACHMENT${i}`] = extDrawBuffers[`COLOR_ATTACHMENT${i}_WEBGL`];
        gl[`DRAW_BUFFER${i}`] = extDrawBuffers[`DRAW_BUFFER${i}_WEBGL`];
      }

      gl.MAX_COLOR_ATTACHMENTS = extDrawBuffers.MAX_COLOR_ATTACHMENTS_WEBGL;
      gl.MAX_DRAW_BUFFERS = extDrawBuffers.MAX_DRAW_BUFFERS_WEBGL;
      gl.MAX_DRAW_BUFFERS = extDrawBuffers.MAX_DRAW_BUFFERS_WEBGL;
    }
  }

  // Texture Anisotropic Filter
  if (!gl.MAX_TEXTURE_MAX_ANISOTROPY) {
    const extTextureFilterAnisotropic = gl.getExtension('EXT_texture_filter_anisotropic');
    if (extTextureFilterAnisotropic) {
      gl.MAX_TEXTURE_MAX_ANISOTROPY = extTextureFilterAnisotropic.MAX_TEXTURE_MAX_ANISOTROPY_EXT;
      gl.TEXTURE_MAX_ANISOTROPY = extTextureFilterAnisotropic.TEXTURE_MAX_ANISOTROPY_EXT;
    }
  }

  if (!gl.MIN) {
    const extBlendMinmax = gl.getExtension('EXT_blend_minmax');
    if (extBlendMinmax) {
      gl.MIN = extBlendMinmax.MIN_EXT;
      gl.MAX = extBlendMinmax.MAX_EXT;
    }
  }

  if (!gl.FRAGMENT_SHADER_DERIVATIVE_HINT) {
    const extStandardDerivatives = gl.getExtension('OES_standard_derivatives');
    if (extStandardDerivatives) {
      gl.FRAGMENT_SHADER_DERIVATIVE_HINT = extStandardDerivatives.FRAGMENT_SHADER_DERIVATIVE_HINT_OES;
    }
  }

  if (!gl.UNSIGNED_INT_24_8) {
    const extDepthTexture = gl.getExtension('WEBGL_depth_texture');
    if (extDepthTexture) {
      gl.UNSIGNED_INT_24_8 = extDepthTexture.UNSIGNED_INT_24_8_WEBGL;
    }
  }

  if (!gl.HALF_FLOAT) {
    const extTextureHalfFloat = gl.getExtension('OES_texture_half_float');
    if (extTextureHalfFloat) {
      gl.HALF_FLOAT = extTextureHalfFloat.HALF_FLOAT_OES;
    }
  }

  // texture compression
  gl.extS3tc = gl.getExtension('WEBGL_compressed_texture_s3tc');
  gl.extPvrtc = gl.getExtension('WEBGL_compressed_texture_pvrtc');
  gl.extAstc = gl.getExtension('WEBGL_compressed_texture_astc');
  gl.extEtc = gl.getExtension('WEBG_compressed_texture_etc');
  gl.extEtc1 = gl.getExtension('WEBG_compressed_texture_etc1');
  gl.extBc7 = gl.getExtension('EXT_texture_compression_bptc');

  gl.extDebugShaders = gl.getExtension('WEBGL_debug_shaders');

  gl._elementIndexUint = !!gl.getExtension('OES_element_index_uint');
  gl._fragDepth = !!gl.getExtension('EXT_frag_depth');
  gl._textureFloat = !!gl.getExtension('OES_texture_float');
  gl._textureFloatLinear = !!gl.getExtension('OES_texture_float_linear');

  gl._colorBufferFloat = !!gl.getExtension('EXT_color_buffer_float');
  gl._colorBufferHalfFloat = !!gl.getExtension('EXT_color_buffer_half_float');
  gl._floatBlend = !!gl.getExtension('EXT_float_blend');

  gl._shaderTextureLod = !!gl.getExtension('EXT_shader_texture_lod');

  return gl;
}

function defined(a) {
  return a !== null && a !== undefined;
}

/**
 * Create a program and/or bind attribute location.
 * @param {WebGLRenderingContext} gl 
 * @param {String} vertexShaderSource 
 * @param {String} fragmentShaderSource 
 * @param {Object} attributeLocations { [attributeName]: location }
 * @returns 
 */
function createProgram(gl, vertexShaderSource, fragmentShaderSource, attributeLocations) {
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

  // bind attribute location
  if (defined(attributeLocations)) {
    for (const attributeName in attributeLocations) {
      if (Object.hasOwnProperty.call(attributeLocations, attributeName)) {
        const location = attributeLocations[attributeName];
        gl.bindAttribLocation(program, location, attributeName);
      }
    }
  }

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
  }

  return program;
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

function validateGLConstantDefination(gl, constantName) {
  const constant = gl[constantName];
  if (!defined(constant)) {
    throw new Error('gl.' + constantName + ' is not defined.');
  }
  return constant;
}

function applyStencilStateSeparate(gl, face, state) {
  if (defined(state.writeMask)) {
    gl.stencilMaskSeparate(face, state.writeMask);
  }

  if (defined(state.func) &&
    defined(state.ref) &&
    defined(state.valueMask)
  ) {
    if (validateStencilFunc(state.func) === false) {
      throw new Error('setState: stencil func is invalid, current is ' + state.func + '!');
    }
    const func = state.func.toUpperCase();
    gl.stencilFuncSeparate(face, gl[func], state.ref, state.valueMask);
  }

  if (defined(state.fail) &&
    defined(state.zfail) &&
    defined(state.zpass)
  ) {
    if (validateStencilOp(state.fail) === false ||
      validateStencilOp(state.zfail) === false ||
      validateStencilOp(state.zpass) === false
    ) {
      throw new Error('setState: stencil op is invalid, current is ' + state.fail + ', ' + state.zfail + ', ' + state.zpass + '!');
    }
    const fail = state.fail.toUpperCase();
    const zfail = state.zfail.toUpperCase();
    const zpass = state.zpass.toUpperCase();
    gl.stencilOpSeparate(face, gl[fail], gl[zfail], gl[zpass]);
  }
}

function setState(gl, state) {
  const { depthTest, stencilTest, colorMask, cull, blend, viewport, scissor, polygonOffset, sampleCoverage, dither } = state;

  if (cull) {
    if (cull.enable) {
      gl.enable(gl.CULL_FACE);
    } else {
      gl.disable(gl.CULL_FACE);
    }

    const face = cull.face && cull.face.toUpperCase();
    if (face === 'BACK' || face === 'FRONT' || face === 'FRONT_AND_BACK') {
      gl.cullFace(gl[face]);
    }

    let frontFace = defined(cull.frontFace) && cull.frontFace.toUpperCase();
    if (frontFace === 'CCW' || frontFace === 'CW') {
      gl.frontFace(gl[frontFace]);
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

    // pass = (ref & readMask) func (stencilValue & redMask)
    // If the stencil test fails, the incoming fragment is discarded
    // if (!pass)
         // update stencilValue
    //   stencilValue = failOp(ref, stencilValue) & writeMask
    // else if zfail
    //   zfailOp
    // else if zpass
    //   zpassOp 
    const { front, back } = stencilTest;
    if (front) {
      applyStencilStateSeparate(gl, gl.FRONT, front);
    }
    if (back) {
      applyStencilStateSeparate(gl, gl.BACK, back);
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

    if (blend.blendEquationSeparate) {
      const { rgb, alpha } = blend.blendEquationSeparate;
      if (!defined(rgb) || !defined(alpha)) {
        throw new Error('To use blendEquationSeparate you MUST specify rgb and alpha.');
      }
      const RGB = rgb.toUpperCase();
      const ALPHA = alpha.toUpperCase();

      const glRGB = gl[RGB];
      const glALPHA = gl[ALPHA];
      if (!defined(glRGB)) {
        throw new Error('gl.' + RGB + ' is undefined.');
      }
      if (!defined(glALPHA)) {
        throw new Error('gl.' + ALPHA + ' is undefined.');
      }

      gl.blendEquationSeparate(glRGB, glALPHA);
    } else if (blend.blendEquation) {
      const equationName = blend.blendEquation.toUpperCase();
      const equation = gl[equationName];
      if (!defined(equation)) {
        throw new Error(equationName + ' is invalid.');
      }

      gl.blendEquation(equation);
    }

    const blendFuncSeparate = blend.blendFuncSeparate;
    if (defined(blendFuncSeparate)) {
      const { srcRGB, dstRGB, srcAlpha, dstAlpha } = blendFuncSeparate;
      if (!defined(srcRGB)) {
        throw new Error('To use blendFuncSeparate you MUST specify srcRGB property.');
      }
      if (!defined(dstRGB)) {
        throw new Error('To use blendFuncSeparate you MUST specify dstRGB property.');
      }
      if (!defined(srcAlpha)) {
        throw new Error('To use blendFuncSeparate you MUST specify srcAlpha property.');
      }
      if (!defined(dstAlpha)) {
        throw new Error('To use blendFuncSeparate you MUST specify dstAlpha property.');
      }

      const SRCRGB = srcRGB.toUpperCase();
      const DSTRGB = dstRGB.toUpperCase();
      const SRCALPHA = srcAlpha.toUpperCase();
      const DSTALPHA = dstAlpha.toUpperCase();

      const glSrcRGB = validateGLConstantDefination(gl, SRCRGB);
      const glDstRGB = validateGLConstantDefination(gl, DSTRGB);
      const glSrcAlpha = validateGLConstantDefination(gl, SRCALPHA);
      const glDstAlpha = validateGLConstantDefination(gl, DSTALPHA);

      gl.blendFuncSeparate(glSrcRGB, glDstRGB, glSrcAlpha, glDstAlpha);
    } else if (defined(blend.blendFunc)) {
      const srcFuncName = blend.blendFunc[0].toUpperCase();
      const dstFuncName = blend.blendFunc[1].toUpperCase();
      const src = validateGLConstantDefination(gl, srcFuncName);
      const dst = validateGLConstantDefination(gl, dstFuncName);
      gl.blendFunc(src, dst);
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

  // motivation: for render coplanar primitives
  // https://www.opengl.org/archives/resources/faq/technical/polygonoffset.htm
  if (defined(polygonOffset)) {
    if (polygonOffset.enable === true) {
      gl.enable(gl.POLYGON_OFFSET_FILL);
    } else if (polygonOffset.enable === false) {
      gl.disable(gl.POLYGON_OFFSET_FILL);
    } else {
      console.warn('polygonOffset.enable MUST be either true or false, current is ' + polygonOffset.enable.toString() + '.');
    }
    // Offset value: o = m * factor + r * units,
    // where m is maximum depth slope of a triangle,
    // r is minimum resolvable difference, which is an implementation-dependent constant.
    gl.polygonOffset(polygonOffset.factor, polygonOffset.units);
  }

  if (defined(sampleCoverage)) {
    const { alphaToCoverage, value, invert, enable } = sampleCoverage;

    if (alphaToCoverage === true) {
      gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    } else if (alphaToCoverage === false) {
      gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    }

    if (enable === true) {
      gl.enable(gl.SAMPLE_COVERAGE);
    } else if (enable === false) {
      gl.disable(gl.SAMPLE_COVERAGE);
    }

    if (defined(value) && defined(invert)) {
      if (invert !== true && invert !== false) {
        console.warn('sampleCoverage.invert MUST be boolean.');
      }
      gl.sampleCoverage(value, invert);
    }
  }

  if (defined(dither)) {
    if (dither === true) {
      gl.enable(gl.DITHER);
    } else if (dither === false) {
      gl.disable(gl.DITHER);
    } else {
      console.warn('setState: dither MUST be a boolean value, otherwise it will be ignored.');
    }
  }
  
}

const WebGLConstant = {
  // ACTIVE_TEXTURE
  34016: 'ACTIVE_TEXTURE',
  33984: 'TEXTURE0',
  33985: 'TEXTURE1',
  33986: 'TEXTURE2',
  33987: 'TEXTURE3',
  33988: 'TEXTURE4',
  33989: 'TEXTURE5',
  33990: 'TEXTURE6',
  33991: 'TEXTURE7',
  33992: 'TEXTURE8',
  33993: 'TEXTURE9',
  33994: 'TEXTURE10',
  33995: 'TEXTURE11',
  33996: 'TEXTURE12',
  33997: 'TEXTURE13',
  33998: 'TEXTURE14',
  33999: 'TEXTURE15',
  34000: 'TEXTURE16',
  34001: 'TEXTURE17',
  34002: 'TEXTURE18',
  34003: 'TEXTURE19',
  34004: 'TEXTURE20',
  34005: 'TEXTURE21',
  34006: 'TEXTURE22',
  34007: 'TEXTURE23',
  34008: 'TEXTURE24',
  34009: 'TEXTURE25',
  34010: 'TEXTURE26',
  34011: 'TEXTURE27',
  34012: 'TEXTURE28',
  34013: 'TEXTURE29',
  34014: 'TEXTURE30',
  34015: 'TEXTURE31',

  3410: 'RED_BITS',
  3411: 'GREEN_BITS',
  3412: 'BLUE_BITS',
  3413: 'ALPHA_BITS',

  2884: 'CULL_FACE',
  // cullFace
  2885: 'CULL_FACE_MODE',
  1028: 'FRONT',
  1029: 'BACK',
  1032: 'FRONT_AND_BACK',

  // depthFunc, stencilFunc
  512: 'NEVER',
  513: 'LESS',
  514: 'EQUAL',
  515: 'LEQUAL',
  516: 'GREATER',
  517: 'NOTEQUAL',
  518: 'GEQUAL',
  519: 'ALWAYS',

  // stencilOp(fail, zfail, zpass)
  // stencilOpSeparate(face, fail, zfail, zpass)
  0: 'ZERO', // blendFunc
  1: 'ONE',
  5386: 'INVERT',
  7680: 'KEEP',
  7681: 'REPLACE',
  7682: 'INCR',
  7683: 'DECR',
  34055: 'INCR_WRAP',
  34056: 'DECR_WRAP',

  // blendEquationSeparate
  32774: 'FUNC_ADD',
  32778: 'FUNC_SUBTRACT',
  32779: 'FUNC_REVERSE_SUBTRACT',

  // blendFuncSeparate
  768: 'SRC_COLOR',
  770: 'SRC_ALPHA',
  774: 'DST_COLOR',
  772: 'DST_ALPHA',
  32769: 'CONSTANT_COLOR',
  32771: 'CONSTANT_ALPHA',

  769: 'ONE_MINUS_SRC_COLOR',
  771: 'ONE_MINUS_SRC_ALPHA',
  775: 'ONE_MINUS_DST_COLOR',
  773: 'ONE_MINUS_DST_ALPHA',
  32770: 'ONE_MINUS_CONSTANT_COLOR',
  32772: 'ONE_MINUS_CONSTANT_ALPHA',

  // FRONT_FACE
  2304: 'CW',
  2305: 'CCW',

  // hint
  4352: 'DONT_CARE',
  4353: 'FASTEST',
  4354: 'NICEST',

  // WEBGL_compressed_texture_s3tc
  33776: 'COMPRESSED_RGB_S3TC_DXT1_EXT',
  33777: 'COMPRESSED_RGBA_S3TC_DXT1_EXT',
  33778: 'COMPRESSED_RGBA_S3TC_DXT3_EXT',
  33779: 'COMPRESSED_RGBA_S3TC_DXT5_EXT',
  // EXT_texture_compression_bptc
  36492: 'COMPRESSED_RGBA_BPTC_UNORM_EXT',
  36493: 'COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT',
  36494: 'COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT',
  36495: 'COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT',
  // EXT_texture_compression_rgtc
  36283: 'COMPRESSED_RED_RGTC1_EXT',
  36284: 'COMPRESSED_SIGNED_RED_RGTC1_EXT',
  36285: 'COMPRESSED_RED_GREEN_RGTC2_EXT',
  36286: 'COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT',

  // UNPACK_COLORSPACE_CONVERSION_WEBGL
  37444: 'BROWSER_DEFAULT_WEBGL',

  BYTE: 0x1400,
  UNSIGNED_BYTE: 0x1401,
  SHORT: 0x1402,
  UNSIGNED_SHORT: 0x1403,
  INT: 0x1404,
  UNSIGNED_INT: 0x1405,
  FLOAT: 0x1406,
};

function getState(gl) {
  // cull face-related state
  const cullFaceEnabled = gl.getParameter(gl.CULL_FACE);
  const cullFaceMode = gl.getParameter(gl.CULL_FACE_MODE);
  
  // stencil-related state
  const depthTestEnabled = gl.getParameter(gl.DEPTH_TEST);
  const depthClearValue = gl.getParameter(gl.DEPTH_CLEAR_VALUE);
  const depthFunc = gl.getParameter(gl.DEPTH_FUNC);
  const depthWritemask = gl.getParameter(gl.DEPTH_WRITEMASK);
  const depthRange = gl.getParameter(gl.DEPTH_RANGE);
  const depthBits = gl.getParameter(gl.DEPTH_BITS);

  const stencilTestEnabled = gl.getParameter(gl.STENCIL_TEST);
  const stencilClearValue = gl.getParameter(gl.STENCIL_CLEAR_VALUE);

  const stencilRef = gl.getParameter(gl.STENCIL_REF);
  const stencilFunc = gl.getParameter(gl.STENCIL_FUNC);
  const stencilFail = gl.getParameter(gl.STENCIL_FAIL);
  const stencilPassDepthFail = gl.getParameter(gl.STENCIL_PASS_DEPTH_FAIL);
  const stencilPassDepthPass = gl.getParameter(gl.STENCIL_PASS_DEPTH_PASS);
  const stencilValueMask = gl.getParameter(gl.STENCIL_VALUE_MASK);
  const stencilWritemask = gl.getParameter(gl.STENCIL_WRITEMASK);

  const stencilBackRef = gl.getParameter(gl.STENCIL_BACK_REF);
  const stencilBackFunc = gl.getParameter(gl.STENCIL_BACK_FUNC);
  // what action is taken for back-facing polygons when the stencil test fails. Initial value is KEEP
  const stencilBackFail = gl.getParameter(gl.STENCIL_BACK_FAIL);
  const stencilBackPassDepthFail = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_FAIL);
  const stencilBackPassDepthPass = gl.getParameter(gl.STENCIL_BACK_PASS_DEPTH_PASS);
  const stencilBackValueMask = gl.getParameter(gl.STENCIL_BACK_VALUE_MASK);
  const stencilBackWritemask = gl.getParameter(gl.STENCIL_BACK_WRITEMASK);

  const stencilBits = gl.getParameter(gl.STENCIL_BITS);

  // blend
  const blendEnable = gl.getParameter(gl.BLEND);
  // blendColor
  const blendColor = gl.getParameter(gl.BLEND_COLOR);
  // blendFuncSeparate
  const blendDstRGB = gl.getParameter(gl.BLEND_DST_RGB);
  const blendDstAlpha = gl.getParameter(gl.BLEND_DST_ALPHA);
  const blendSrcRGB = gl.getParameter(gl.BLEND_SRC_RGB);
  const blendSrcAlpha = gl.getParameter(gl.BLEND_SRC_ALPHA);
  // blendEquationSeparate
  const blendEquationRGB = gl.getParameter(gl.BLEND_EQUATION_RGB);
  const blendEquationAlpha = gl.getParameter(gl.BLEND_EQUATION_ALPHA);

  // viewport
  const currentViewport = gl.getParameter(gl.VIEWPORT);
  const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS);

  const scissorTestEnable = gl.getParameter(gl.SCISSOR_TEST);
  const scissorBox = gl.getParameter(gl.SCISSOR_BOX);

  // polygon offset fill
  const polygonOffsetFillEnable = gl.getParameter(gl.POLYGON_OFFSET_FILL);
  const polygonOffsetFactor = gl.getParameter(gl.POLYGON_OFFSET_FACTOR);
  const polygonOffsetUnits = gl.getParameter(gl.POLYGON_OFFSET_UNITS);

  const ditherEnable = gl.getParameter(gl.DITHER);

  // 
  const redBits = gl.getParameter(gl.RED_BITS);
  const greenBits = gl.getParameter(gl.GREEN_BITS);
  const blueBits = gl.getParameter(gl.BLUE_BITS);
  const alphaBits = gl.getParameter(gl.ALPHA_BITS);
  const subpixelBits = gl.getParameter(gl.SUBPIXEL_BITS);

  const aliasedLineWidthRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
  const aliasedPointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);

  // color write mask
  const colorWritemask = gl.getParameter(gl.COLOR_WRITEMASK);
  const colorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE);

  // texture-related state
  const activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
  // The maximum number of texture image units available to the fragment stage of the GL
  const maxTextureImageUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  // Both the vertex shader and fragment processing combined cannot use more than MAX_COMBINED_TEXTURE_IMAGE_UNITS texture image units.
  const maxCombinedTextureImageUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxCubeMapTextureSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
  const maxRenderbuffereSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

  // 
  const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
  // The maximum number of texture image units available to a vertex shader
  const maxVertexTextureImageUnits = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
  const maxVertexUniformVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
  const maxVaryingVectors = gl.getParameter(gl.MAX_VARYING_VECTORS);

  // gl.pixelStorei(pname, param)
  const packAlignment = gl.getParameter(gl.PACK_ALIGNMENT);
  const unpackAlignment = gl.getParameter(gl.UNPACK_ALIGNMENT);
  const unpackColorspaceConversionWebgl = gl.getParameter(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL);
  const unpackFlipYWebgl = gl.getParameter(gl.UNPACK_FLIP_Y_WEBGL);
  const unpackPremultiplyAlphaWebgl = gl.getParameter(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL);

  // 
  const vendor = gl.getParameter(gl.VENDOR); 
  const version = gl.getParameter(gl.VERSION); 

  // Uint32Array
  const compressedTextureFormats = gl.getParameter(gl.COMPRESSED_TEXTURE_FORMATS);

  // binding
  const currentProgram = gl.getParameter(gl.CURRENT_PROGRAM);
  const arrayBufferBinding = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
  const elementArrayBufferBinding = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
  const framebufferBinding = gl.getParameter(gl.FRAMEBUFFER_BINDING);
  const renderbufferBinding = gl.getParameter(gl.RENDERBUFFER_BINDING);
  const textureBinding2D = gl.getParameter(gl.TEXTURE_BINDING_2D);
  const textureBindingCubeMap = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
  const renderer = gl.getParameter(gl.RENDERER);

  // sample coverage
  const samples = gl.getParameter(gl.SAMPLES);
  const sampleBuffers = gl.getParameter(gl.SAMPLE_BUFFERS);
  const sampleAlphaToCoverage = gl.getParameter(gl.SAMPLE_ALPHA_TO_COVERAGE);
  const sampleCoverageInvert = gl.getParameter(gl.SAMPLE_COVERAGE_INVERT);
  const sampleConverageValue =  gl.getParameter(gl.SAMPLE_COVERAGE_VALUE);

  const frontFaceOrder = gl.getParameter(gl.FRONT_FACE);

  const lineWidth = gl.getParameter(gl.LINE_WIDTH);

  const generateMipmapHint = gl.getParameter(gl.GENERATE_MIPMAP_HINT);

  const shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);


  return {
    cullFace: {
      CULL_FACE: cullFaceEnabled,
      CULL_FACE_MODE: WebGLConstant[cullFaceMode],
    },
    depth: {
      DEPTH_TEST: depthTestEnabled,
      DEPTH_CLEAR_VALUE: depthClearValue,
      DEPTH_FUNC: WebGLConstant[depthFunc],
      DEPTH_WRITEMASK: depthWritemask,
      DEPTH_RANGE: depthRange,
      DEPTH_BITS: depthBits,
    },
    stencil: {
      STENCIL_TEST: stencilTestEnabled,
      STENCIL_CLEAR_VALUE: stencilClearValue,
      STENCIL_BITS: stencilBits,
      front: {
        STENCIL_REF: stencilRef,
        STENCIL_FUNC: WebGLConstant[stencilFunc],
        STENCIL_FAIL: WebGLConstant[stencilFail],
        STENCIL_PASS_DEPTH_FAIL: WebGLConstant[stencilPassDepthFail],
        STENCIL_PASS_DEPTH_PASS: WebGLConstant[stencilPassDepthPass],
        STENCIL_VALUE_MASK: Number(stencilValueMask).toString(16),
        STENCIL_WRITEMASK: Number(stencilWritemask).toString(16),
      },
      back: {
        STENCIL_BACK_REF: stencilBackRef,
        STENCIL_BACK_FUNC: WebGLConstant[stencilBackFunc],
        STENCIL_BACK_FAIL: WebGLConstant[stencilBackFail],
        STENCIL_BACK_PASS_DEPTH_FAIL: WebGLConstant[stencilBackPassDepthFail],
        STENCIL_BACK_PASS_DEPTH_PASS: WebGLConstant[stencilBackPassDepthPass],
        STENCIL_BACK_VALUE_MASK: Number(stencilBackValueMask).toString(16),
        STENCIL_BACK_WRITEMASK: Number(stencilBackWritemask).toString(16),  
      },
    },
    blend: {
      BLEND: blendEnable,
      BLEND_COLOR: blendColor,
      BLEND_DST_RGB: WebGLConstant[blendDstRGB],
      BLEND_DST_ALPHA: WebGLConstant[blendDstAlpha],
      BLEND_SRC_RGB: WebGLConstant[blendSrcRGB],
      BLEND_SRC_ALPHA: WebGLConstant[blendSrcAlpha],
      BLEND_EQUATION_RGB: WebGLConstant[blendEquationRGB],
      BLEND_EQUATION_ALPHA: WebGLConstant[blendEquationAlpha],
    },
    viewport: {
      VIEWPORT: currentViewport,
      MAX_VIEWPORT_DIMS: maxViewportDims,
    },
    scissor: {
      SCISSOR_TEST: scissorTestEnable,
      SCISSOR_BOX: scissorBox,
    },
    polygonOffset: {
      POLYGON_OFFSET_FILL: polygonOffsetFillEnable,
      POLYGON_OFFSET_FACTOR: polygonOffsetFactor,
      POLYGON_OFFSET_UNITS: polygonOffsetUnits,
    },
    DITHER: ditherEnable,

    binding: {
      ARRAY_BUFFER_BINDING: arrayBufferBinding,
      ELEMENT_ARRAY_BUFFER_BINDING: elementArrayBufferBinding,
      CURRENT_PROGRAM: currentProgram,
      FRAMEBUFFER_BINDING: framebufferBinding,
      RENDERBUFFER_BINDING: renderbufferBinding,
      TEXTURE_BINDING_2D: textureBinding2D,
      TEXTURE_BINDING_CUBE: textureBindingCubeMap,
    },
    RENDERER: renderer,

    color: {
      RED_BITS: redBits,
      GREEN_BITS: greenBits,
      BLUE_BITS: blueBits,
      ALPHA_BITS: alphaBits,
      SUBPIXEL_BITS: subpixelBits,
      COLOR_CLEAR_VALUE: colorClearValue,
      COLOR_WRITEMASK: colorWritemask,
    },
    aliasedRange: {
      ALIASED_LINE_WIDTH_RANGE : aliasedLineWidthRange,
      ALIASED_POINT_SIZE_RANGE: aliasedPointSizeRange,
    },
    texture: {
      MAX_TEXTURE_IMAGE_UNITS: maxTextureImageUnits,
      MAX_COMBINED_TEXTURE_IMAGE_UNITS: maxCombinedTextureImageUnits,
      ACTIVE_TEXTURE: WebGLConstant[activeTexture],
      MAX_TEXTURE_SIZE: maxTextureSize,
      MAX_CUBE_MAP_TEXTURE_SIZE: maxCubeMapTextureSize,
      MAX_RENDERBUFFER_SIZE: maxRenderbuffereSize,
    },
    COMPRESSED_TEXTURE_FORMATS: Array.from(compressedTextureFormats).map(format => WebGLConstant[format]),
    // numCompressedTextureFormats,

    GENERATE_MIPMAP_HINT: WebGLConstant[generateMipmapHint],
    LINE_WIDTH: lineWidth,
    FRONT_FACE: WebGLConstant[frontFaceOrder],

    SHADING_LANGUAGE_VERSION: shadingLanguageVersion,
    vertex: {
      MAX_VERTEX_ATTRIBS: maxVertexAttribs,
      MAX_VERTEX_TEXTURE_IMAGE_UNITS: maxVertexTextureImageUnits,
      MAX_VERTEX_UNIFORM_VECTORS: maxVertexUniformVectors,
      MAX_VARYING_VECTORS: maxVaryingVectors
    },
    sample: {
      SAMPLES: samples,
      SAMPLE_BUFFERS: sampleBuffers,
      SAMPLE_ALPHA_TO_COVERAGE: sampleAlphaToCoverage,
      SAMPLE_COVERAGE_VALUE: sampleConverageValue,
      SAMPLE_COVERAGE_INVERT: sampleCoverageInvert
    },
    unpack: {
      PACK_ALIGNMENT: packAlignment,
      UNPACK_ALIGNMENT: unpackAlignment,
      UNPACK_FLIP_Y_WEBGL: unpackFlipYWebgl,
      UNPACK_PREMULTIPLY_ALPHA_WEBGL: unpackPremultiplyAlphaWebgl,
      UNPACK_COLORSPACE_CONVERSION_WEBGL: WebGLConstant[unpackColorspaceConversionWebgl],
    },
    VENDOR: vendor,
    VERSION: version,
  };
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
  const colorAttachments = defaultValue(options.colorAttachments, [ colorTexture ]);

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  // color
  gl.activeTexture(gl.TEXTURE0);
  const colorAttachmentsLength = colorAttachments.length;
  if (colorAttachmentsLength > 1) {
    const ext = gl.getExtension('WebGL_draw_buffers');
    const drawBuffers = [];
    for (let i = 0; i < colorAttachmentsLength; i++) {
      drawBuffers.push(ext.COLOR_ATTACHMENT0_WEBGL + i);
    }
    ext.drawBuffersWEBGL(drawBuffers);

    for (let i = 0; i < colorAttachmentsLength; i++) {
      const colorAttachment = colorAttachments[i];
      gl.bindTexture(gl.TEXTURE_2D, colorAttachment);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, colorAttachment, 0);
    }
  } else {
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);

  // depth
  if (depthTexture) {
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  else if (depthRenderbuffer) {
    const renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, depthRenderbuffer.width, depthRenderbuffer.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
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

/**
 * Create a WebGLTexture.
 * @memberof ToyGL
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
      } else if (textureTarget === gl.TEXTURE_3D) ;

    } else {
      const border = 0;
      if (textureTarget === gl.TEXTURE_2D) {
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElem);
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

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

  return texture;
}

const cachedBuffer = {};

function isArrayBufferView(value) {
  return value instanceof Float32Array ||
         value instanceof Uint8Array ||
         value instanceof Uint16Array ||
         value instanceof Uint32Array ||
         value instanceof Int8Array ||
         value instanceof Int16Array ||
         value instanceof Int32Array;
}

function getIndicesType(indices) {
  let indicesType;
  let max = indices[0];
  for (let i = 1; i < indices.length; i++) {
    max = Math.max(max, indices[i]);
  }

  if (max <= 255) {
    indicesType = WebGLConstant.UNSIGNED_BYTE;
  } else if (max <= 65535) {
    indicesType = WebGLConstant.UNSIGNED_SHORT;
  } else {
    indicesType = WebGLConstant.UNSIGNED_INT;
  }

  return indicesType;
}

function createBuffer(gl, bufferTarget, source, usage) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(bufferTarget, buffer);
  gl.bufferData(bufferTarget, source, usage);
  gl.bindBuffer(bufferTarget, null);
  return buffer;
}

function createAttributeBuffer(gl, typedArrayOrArray, usage) {
  let bufferKey = '';
  for (const element of typedArrayOrArray) {
    if (bufferKey.length > 10e5) break;
    bufferKey += `${element.toFixed(3)},`;
  }
  let buffer = cachedBuffer[bufferKey];
  if (buffer) {
    return buffer;
  }

  usage = defaultValue(usage, gl.STATIC_DRAW);

  let typedArray;
  if (Array.isArray(typedArrayOrArray)) {
    typedArray = new Float32Array(typedArrayOrArray);
  } else if (isArrayBufferView(typedArrayOrArray)) {
    typedArray = typedArrayOrArray;
  } else {
    throw new Error('Buffer data' + typedArrayOrArray + 'must be TypedArray or Array ');
  }

  buffer = createBuffer(gl, gl.ARRAY_BUFFER, typedArray, usage);
  cachedBuffer[bufferKey] = buffer;
  return buffer;
}

function createIndicesBuffer(gl, typedArrayOrArray, usage) {
  const bufferKey = typedArrayOrArray.toString();
  let buffer = cachedBuffer[bufferKey];
  if (buffer) {
    return buffer;
  }

  usage = defaultValue(usage, gl.STATIC_DRAW);

  let typedArray;
  const indicesType = getIndicesType(typedArrayOrArray);

  if (indicesType === gl.UNSIGNED_BYTE) {

    typedArray = new Uint8Array(typedArrayOrArray);

  } else if (indicesType === gl.UNSIGNED_SHORT) {

    typedArray = new Uint16Array(typedArrayOrArray);

  } else if (indicesType === gl.UNSIGNED_INT) {

    typedArray = new Uint32Array(typedArrayOrArray);
    gl.getExtension('OES_element_index_unit');

  } else {
    throw new Error('Buffer data must be TypedArray or Array ');
  }

  buffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, typedArray, usage);
  // Store index buffer data type
  buffer.indicesType = indicesType;
  cachedBuffer[bufferKey] = buffer;
  return buffer;
}

/**
 * Create a vertex array object. You can imagine it like this
 * <pre>
 * var glState = {
 *   attributeState: {
 *     ELEMENT_ARRAY_BUFFER: null,
 *     attributes: [
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *     ],
 *   },
 * </pre>
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl 
 * @param {Object} options 
 * @param {Object} options.attributes The key of Object is vertex attribute name, value is a Object, it includes <code>location</code>, <code>size</code> and <code>data</code> property, for example:
 * <pre>
 * {
 *   a_pos: {
 *     location: 0,
 *     size: 3,
 *     data: [
 *       0, 0, 0,
 *       1, 1, 1,
 *       0, 1, 0,
 *     ]
 *   }
 * }
 * </pre>
 * @param {Object} options.indices ELEMENT_ARRAY_BUFFER of vertex array.
 * @returns {WebGLVertexArrayObjectOES}
 */
function createVAO(gl, options) {
  if (!gl.createVertexArray) return undefined;

  const oldVao = gl.getParameter(gl.VERTEX_ARRAY_BINDING);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const attributes = options.attributes;
  const indices = options.indices;

  for (const attributeName in attributes) {
    if (Object.hasOwnProperty.call(attributes, attributeName)) {
      const { location, data, size } = attributes[attributeName];

      const buffer = createAttributeBuffer(gl, data, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(location);

      // TODO: expose attribute data type
      const type = gl.FLOAT;
      const normalized = false;
      const stride = 0;
      const offset = 0;
      gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
    }
  }

  if (defined(indices)) {
    const indicesBuffer = createIndicesBuffer(gl, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
  }

  gl.bindVertexArray(oldVao);

  return vao;
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
 * @param {WebGLVertexArrayObjectOES} [options.vao] @see {@link createVAO}
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
      } else if (isArrayLike(uniform)) {
        const size = uniform.length;
        if (size <= 4) {
          gl['uniform' + size + 'fv' ](uniformLocation, uniform);
        } else if (size <= 16) {
          const order = Math.floor(Math.sqrt(size));
          const transpose = false; // MUST be false
          gl['uniformMatrix' + order + 'fv'](uniformLocation, transpose, Array.from(uniform));
        }
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

const ToyGL = {
  createContext,
  setState,
  getState,
  clear,
  draw,
  createTexture,
  updateTexture,
  createCubeMap,
  createVAO,
  createFramebuffer,
};

export default ToyGL;
