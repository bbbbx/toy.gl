import defined from './defined.js';
import {
  validateStencilFunc,
  validateStencilOp,
} from "./glUtils.js";

export default function setState(gl, state) {
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
      gl.enable(gl.BLEND)
    } else if (blend.enable === false) {
      gl.disable(gl.BLEND)
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
};
