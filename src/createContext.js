import defaultValue from './defaultValue.js';

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

export default createContext;
