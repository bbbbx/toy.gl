import WebGLConstant from './WebglConstant.js';

export default function getState(gl) {
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
  const unpackColorspaceConversionWebgl = gl.getParameter(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL)
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
