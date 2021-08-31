import defined from './defined.js';
import {
  validateGLConstantDefination,
  validateStencilFunc,
  validateStencilOp,
} from "./glUtils.js";

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

export default function setState(gl, state) {
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
      gl.enable(gl.BLEND)
    } else if (blend.enable === false) {
      gl.disable(gl.BLEND)
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
