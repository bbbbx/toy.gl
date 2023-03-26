import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import CullFace from "../core/CullFace";
import WindingOrder from "../core/WindingOrder";
import BoundingRectangle from "../core/BoundingRectangle";
import Color from "../core/Color";
import DepthFunction from "../core/DepthFunction";
import StencilFunction from "../core/StencilFunction";
import StencilOperation from "../core/StencilOperation";
import BlendEquation from "../core/BlendEquation";
import BlendFunction from "../core/BlendFunction";
import PassState from "./PassState";
import RenderStateConstructor from "./IRenderState";

let nextRenderStateId = 0;
let renderStateCache: {
  [key: string]: {
    referenceCount: number,
    state: RenderState,
  }
} = {};

/**
 * @public
 * A <strong>immutable</strong> object representing the GL global state.
 */
class RenderState {
  frontFace: WindingOrder;
  cull: {
    enabled: boolean,
    face: CullFace,
  };
  depthTest: {
    enabled: boolean,
    func: DepthFunction,
  };
  viewport: BoundingRectangle;
  scissorTest: {
    enabled: boolean,
    rectangle: BoundingRectangle,
  };
  colorMask: {
    red: boolean,
    green: boolean,
    blue: boolean,
    alpha: boolean,
  };
  depthMask: boolean;
  depthRange: {
    near: number,
    far: number,
  };
  blending: {
    enabled: boolean,
    color: Color,
    equationRgb: BlendEquation,
    equationAlpha: BlendEquation,
    functionSourceRgb: BlendFunction,
    functionSourceAlpha: BlendFunction,
    functionDestinationRgb: BlendFunction,
    functionDestinationAlpha: BlendFunction,
  };
  stencilMask: number;
  stencilTest: {
    enabled: boolean,
    frontFunction: StencilFunction,
    backFunction: StencilFunction,
    reference: number,
    mask: number,
    frontOperation: {
      fail: StencilOperation,
      zFail: StencilOperation,
      zPass: StencilOperation,
    },
    backOperation: {
      fail: StencilOperation,
      zFail: StencilOperation,
      zPass: StencilOperation,
    },
  };
  sampleCoverage: {
    enabled: boolean,
    value: number,
    invert: boolean,
  };
  lineWidth: number;
  polygonOffset: {
    enabled: boolean,
    factor: number,
    units: number,
  };

  private id: number;
  private _applyFunctions: ((gl : WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) => void)[][];

  /**
   * See {@link RenderState.fromCache}
   * @param renderState - 
   */
  constructor(renderState: RenderStateConstructor = defaultValue.EMPTY_OBJECT) {
    const rs = renderState;

    this.frontFace = defaultValue(rs.frontFace, WindingOrder.COUNTER_CLOCKWISE);
    this.cull = {
      enabled: defaultValue(rs?.cull?.enabled, false),
      face: defaultValue(rs?.cull?.face, CullFace.BACK),
    };
    this.colorMask = {
      red: defaultValue(rs?.colorMask?.red, true),
      green: defaultValue(rs?.colorMask?.green, true),
      blue: defaultValue(rs?.colorMask?.blue, true),
      alpha: defaultValue(rs?.colorMask?.alpha, true),
    };
    this.scissorTest = {
      enabled: defaultValue(rs?.scissorTest?.enabled, false),
      rectangle: new BoundingRectangle(
        rs?.scissorTest?.rectangle?.x,
        rs?.scissorTest?.rectangle?.y,
        rs?.scissorTest?.rectangle?.width,
        rs?.scissorTest?.rectangle?.height
      ),
    }
    this.depthRange = {
      near: defaultValue(rs?.depthRange?.near, 0.0),
      far: defaultValue(rs?.depthRange?.far, 1.0),
    };
    this.depthTest = {
      enabled: defaultValue(rs?.depthTest?.enabled, false),
      func: defaultValue(rs?.depthTest?.func, DepthFunction.LESS),
    };
    this.depthMask = defaultValue(rs.depthMask, true);
    this.viewport = defined(rs?.viewport)
      ? new BoundingRectangle(rs.viewport.x, rs.viewport.y, rs.viewport.width, rs.viewport.height)
      : undefined;
    this.stencilMask = defaultValue(rs?.stencilMask, ~0);
    this.stencilTest = {
      enabled: defaultValue(rs?.stencilTest?.enabled, false),
      frontFunction: defaultValue(rs?.stencilTest?.frontFunction, StencilFunction.ALWAYS),
      backFunction: defaultValue(rs?.stencilTest?.backFunction, StencilFunction.ALWAYS),
      reference: defaultValue(rs?.stencilTest?.reference, 0),
      mask: defaultValue(rs?.stencilTest?.mask, ~0),
      frontOperation: {
        fail: defaultValue(rs?.stencilTest?.frontOperation?.fail, StencilOperation.KEEP),
        zFail: defaultValue(rs?.stencilTest?.frontOperation?.zFail, StencilOperation.KEEP),
        zPass: defaultValue(rs?.stencilTest?.frontOperation?.zPass, StencilOperation.KEEP),
      },
      backOperation: {
        fail: defaultValue(rs?.stencilTest?.backOperation?.fail, StencilOperation.KEEP),
        zFail: defaultValue(rs?.stencilTest?.backOperation?.zFail, StencilOperation.KEEP),
        zPass: defaultValue(rs?.stencilTest?.backOperation?.zPass, StencilOperation.KEEP),
      },
    };
    this.blending = {
      enabled: defaultValue(rs?.blending?.enabled, false),
      color: new Color(
        defaultValue(rs?.blending?.color?.red, 0.0),
        defaultValue(rs?.blending?.color?.green, 0.0),
        defaultValue(rs?.blending?.color?.blue, 0.0),
        defaultValue(rs?.blending?.color?.alpha, 0.0)
      ),
      equationRgb: defaultValue(rs?.blending?.equationRgb, BlendEquation.ADD),
      equationAlpha: defaultValue(rs?.blending?.equationAlpha, BlendEquation.ADD),
      functionSourceRgb: defaultValue(rs?.blending?.functionSourceRgb, BlendFunction.ONE),
      functionSourceAlpha: defaultValue(rs?.blending?.functionSourceAlpha, BlendFunction.ONE),
      functionDestinationRgb: defaultValue(rs?.blending?.functionDestinationRgb, BlendFunction.ZERO),
      functionDestinationAlpha: defaultValue(rs?.blending?.functionDestinationAlpha, BlendFunction.ZERO),
    };
    this.sampleCoverage = {
      enabled: defaultValue(rs?.sampleCoverage?.enabled, false),
      value: defaultValue(rs?.sampleCoverage?.value, 1.0),
      invert: defaultValue(rs?.sampleCoverage?.invert, false),
    };
    this.polygonOffset = {
      enabled: defaultValue(rs?.polygonOffset?.enabled, false),
      factor: defaultValue(rs?.polygonOffset?.factor, 0),
      units: defaultValue(rs?.polygonOffset?.units, 0),
    };
    this.lineWidth = defaultValue(rs?.lineWidth, 1.0);

    this.id = 0;
    this._applyFunctions = [];
  }

  /**
   * Validates and then finds or creates an immutable render state, which defines the pipeline
   * state for a {@link DrawCommand} or {@link ClearCommand}. All inputs are optional.
   * Omitted states use the default shown in the example below.
   * @example
   * ```js
   * const defaults = {
   *   frontFace: WindingOrder.COUNTER_CLOCKWISE,
   *   cull: {
   *     enabled: false,
   *     face: CullFace.BACK
   *   },
   *   lineWidth: 1,
   *   polygonOffset: {
   *     enabled: false,
   *     factor: 0,
   *     units: 0
   *   },
   *   scissorTest: {
   *     enabled: false,
   *     rectangle: {
   *       x: 0,
   *       y: 0,
   *       width: 0,
   *       height: 0
   *     }
   *   },
   *   depthTest: {
   *     enabled: false,
   *     func: DepthFunction.LESS
   *   },
   *   depthRange: {
   *     near: 0,
   *     far: 1
   *   },
   *   depthMask: true,
   *   stencilMask: ~0,
   *   stencilTest: {
   *     enabled: false,
   *     frontFunction: StencilFunction.ALWAYS,
   *     backFunction: StencilFunction.ALWAYS,
   *     reference: 0,
   *     mask: ~0,
   *     frontOperation: {
   *       fail: StencilOperation.KEEP,
   *       zFail: StencilOperation.KEEP,
   *       zPass: StencilOperation.KEEP
   *     },
   *     backOperation: {
   *       fail: StencilOperation.KEEP,
   *       zFail: StencilOperation.KEEP,
   *       zPass: StencilOperation.KEEP
   *     }
   *   },
   *   blending: {
   *     enabled: false,
   *     color: {
   *       red: 0.0,
   *       green: 0.0,
   *       blue: 0.0,
   *       alpha: 0.0
   *     },
   *     equationRgb: BlendEquation.ADD,
   *     equationAlpha: BlendEquation.ADD,
   *     functionSourceRgb: BlendFunction.ONE,
   *     functionSourceAlpha: BlendFunction.ONE,
   *     functionDestinationRgb: BlendFunction.ZERO,
   *     functionDestinationAlpha: BlendFunction.ZERO
   *   },
   *   colorMask: {
   *     red: true,
   *     green: true,
   *     blue: true,
   *     alpha: true
   *   },
   *   sampleCoverage: {
   *     enabled: false,
   *     value: 1.0,
   *     invert: false
   *   }
   * };
   * const rs = RenderState.fromCache(defaults);
   * ```
   */
  static fromCache(renderState?: RenderStateConstructor): RenderState {
    const partialKey = JSON.stringify(renderState);
    let cachedState = renderStateCache[partialKey];
    if (defined(cachedState)) {
      ++cachedState.referenceCount;
      return cachedState.state;
    }

    // Cache miss. Fully define render state and try again.
    let states = new RenderState(renderState);
    const fullKey = JSON.stringify(states);
    cachedState = renderStateCache[fullKey];
    if (!defined(cachedState)) {
      states.id = nextRenderStateId++;
      cachedState = {
        referenceCount: 0,
        state: states,
      };

      // Cache full render state.  Multiple partially defined render states may map to this.
      renderStateCache[fullKey] = cachedState;
    }

    ++cachedState.referenceCount;

    // Cache partial render state so we can skip validation on a cache hit for a partially defined render state
    renderStateCache[partialKey] = {
      referenceCount: 1,
      state: cachedState.state,
    };

    return cachedState.state;
  }

  static removeFromCache(renderState: RenderStateConstructor) {
    const states = new RenderState(renderState);
    const fullKey = JSON.stringify(states);
    const fullCachedState = renderStateCache[fullKey];

    // decrement partial key reference count
    const partialKey = JSON.stringify(renderState);
    const cachedState = renderStateCache[partialKey];
    if (defined(cachedState)) {
      --cachedState.referenceCount;

      if (cachedState.referenceCount === 0) {
        // remove partial key
        delete renderStateCache[partialKey];

        // decrement full key reference count
        if (defined(fullCachedState)) {
          --fullCachedState.referenceCount;
        }
      }
    }

    // remove full key if reference count is zero
    if (defined(fullCachedState) && fullCachedState.referenceCount === 0) {
      delete renderStateCache[fullKey];
    }
  }

  static getCache() {
    return renderStateCache;
  }

  static clearCache() {
    renderStateCache = {};
  }

  static getState(renderState: RenderState) : ConstructorParameters<typeof RenderState>[0] {
    return {
      frontFace: renderState.frontFace,
      cull: {
        enabled: renderState.cull.enabled,
        face: renderState.cull.face,
      },
      lineWidth: renderState.lineWidth,
      polygonOffset: {
        enabled: renderState.polygonOffset.enabled,
        factor: renderState.polygonOffset.factor,
        units: renderState.polygonOffset.units,
      },
      scissorTest: {
        enabled: renderState.scissorTest.enabled,
        rectangle: BoundingRectangle.clone(renderState.scissorTest.rectangle),
      },
      depthRange: {
        near: renderState.depthRange.near,
        far: renderState.depthRange.far,
      },
      depthTest: {
        enabled: renderState.depthTest.enabled,
        func: renderState.depthTest.func,
      },
      colorMask: {
        red: renderState.colorMask.red,
        green: renderState.colorMask.green,
        blue: renderState.colorMask.blue,
        alpha: renderState.colorMask.alpha,
      },
      depthMask: renderState.depthMask,
      stencilMask: renderState.stencilMask,
      blending: {
        enabled: renderState.blending.enabled,
        color: Color.clone(renderState.blending.color),
        equationRgb: renderState.blending.equationRgb,
        equationAlpha: renderState.blending.equationAlpha,
        functionSourceRgb: renderState.blending.functionSourceRgb,
        functionSourceAlpha: renderState.blending.functionSourceAlpha,
        functionDestinationRgb: renderState.blending.functionDestinationRgb,
        functionDestinationAlpha: renderState.blending.functionDestinationAlpha,
      },
      stencilTest: {
        enabled: renderState.stencilTest.enabled,
        frontFunction: renderState.stencilTest.frontFunction,
        backFunction: renderState.stencilTest.backFunction,
        reference: renderState.stencilTest.reference,
        mask: renderState.stencilTest.mask,
        frontOperation: {
          fail: renderState.stencilTest.frontOperation.fail,
          zFail: renderState.stencilTest.frontOperation.zFail,
          zPass: renderState.stencilTest.frontOperation.zPass,
        },
        backOperation: {
          fail: renderState.stencilTest.backOperation.fail,
          zFail: renderState.stencilTest.backOperation.zFail,
          zPass: renderState.stencilTest.backOperation.zPass,
        },
      },
      sampleCoverage: {
        enabled: renderState.sampleCoverage.enabled,
        value: renderState.sampleCoverage.value,
        invert: renderState.sampleCoverage.invert,
      },
      viewport: defined(renderState.viewport)
        ? BoundingRectangle.clone(renderState.viewport)
        : undefined,
    };
  }

  /**
   * @internal
   * @param gl -
   * @param previousRenderState -
   * @param renderState -
   * @param previousPassState -
   * @param passState -
   * @param clear - Whether apply scissor test
   */
  static partialApply(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    previousRenderState: RenderState,
    renderState: RenderState,
    previousPassState: PassState,
    passState: PassState,
    clear?: boolean
  ) {
    if (previousRenderState !== renderState) {
      // When a new render state is applied, instead of making WebGL calls for all the states or first
      // comparing the states one-by-one with the previous state (basically a linear search), we take
      // advantage of RenderState's immutability, and store a dynamically populated sparse data structure
      // containing functions that make the minimum number of WebGL calls when transitioning from one state
      // to the other.  In practice, this works well since state-to-state transitions generally only require a
      // few WebGL calls, especially if commands are stored by state.
      let funcs = renderState._applyFunctions[previousRenderState.id];
      if (!defined(funcs)) {
        funcs = createFuncs(previousRenderState, renderState);
        renderState._applyFunctions[previousRenderState.id] = funcs;
      }

      const length = funcs.length;
      for (let i = 0; i < length; i++) {
        funcs[i](gl, renderState);
      }
    }

    const previousScissorTest = defaultValue(previousPassState.scissorTest, previousRenderState.scissorTest);
    const scissorTest = defaultValue(passState.scissorTest, renderState.scissorTest);

    // Our scissor rectangle can get out of sync with the GL scissor rectangle on clears.
    // Seems to be a problem only on ANGLE. See https://github.com/CesiumGS/cesium/issues/2994
    if (previousScissorTest !== scissorTest || clear) {
      applyScissorTest(gl, renderState, passState);
    }

    const previousBlendingEnabled: boolean = defaultValue(previousPassState.blendingEnabled, previousRenderState.blending.enabled);
    const blendingEnabled: boolean = defaultValue(passState.blendingEnabled, renderState.blending.enabled);
    if (
      previousBlendingEnabled !== blendingEnabled ||
      (blendingEnabled && previousRenderState.blending !== renderState.blending)
    ) {
      applyBlending(gl, renderState, passState);
    }

    if (
      previousRenderState !== renderState ||
      previousPassState !== passState ||
      previousPassState.context !== passState.context
    ) {
      applyViewport(gl, renderState, passState);
    }
  }

  /**
   * @internal
   * @param gl -
   * @param renderState -
   * @param passState -
   */
  static apply(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState, passState: PassState) {
    applyFrontFace(gl, renderState);
    applyCull(gl, renderState);
    applyLineWidth(gl, renderState);
    applyPolygonOffset(gl, renderState);
    applyDepthRange(gl, renderState);
    applyDepthTest(gl, renderState);
    applyColorMask(gl, renderState);
    applyDepthMask(gl, renderState);
    applyStencilMask(gl, renderState);
    applyStencilTest(gl, renderState);
    applySampleCoverage(gl, renderState);
    applyScissorTest(gl, renderState, passState);
    applyBlending(gl, renderState, passState);
    applyViewport(gl, renderState, passState);
  }

}

function createFuncs(
  previousRenderState: RenderState,
  nextRenderState: RenderState
) : ((gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) => void)[] {
  const funcs = [];

  if (previousRenderState.frontFace !== nextRenderState.frontFace) {
    funcs.push(applyFrontFace);
  }

  if (
    previousRenderState.cull.enabled !== nextRenderState.cull.enabled ||
    previousRenderState.cull.face !== nextRenderState.cull.face
  ) {
    funcs.push(applyCull);
  }

  if (previousRenderState.lineWidth !== nextRenderState.lineWidth) {
    funcs.push(applyLineWidth);
  }

  if (
    previousRenderState.polygonOffset.enabled !== nextRenderState.polygonOffset.enabled ||
    previousRenderState.polygonOffset.factor !== nextRenderState.polygonOffset.factor ||
    previousRenderState.polygonOffset.units !== nextRenderState.polygonOffset.units
  ) {
    funcs.push(applyPolygonOffset);
  }

  if (
    previousRenderState.depthRange.near !== nextRenderState.depthRange.near ||
    previousRenderState.depthRange.far !== nextRenderState.depthRange.far
  ) {
    funcs.push(applyDepthRange);
  }

  if (
    previousRenderState.depthTest.enabled !== nextRenderState.depthTest.enabled ||
    previousRenderState.depthTest.func !== nextRenderState.depthTest.func
  ) {
    funcs.push(applyDepthTest);
  }

  if (
    previousRenderState.colorMask.red !== nextRenderState.colorMask.red ||
    previousRenderState.colorMask.green !== nextRenderState.colorMask.green ||
    previousRenderState.colorMask.blue !== nextRenderState.colorMask.blue ||
    previousRenderState.colorMask.alpha !== nextRenderState.colorMask.alpha
  ) {
    funcs.push(applyColorMask);
  }

  if (previousRenderState.depthMask !== nextRenderState.depthMask) {
    funcs.push(applyDepthMask);
  }

  if (previousRenderState.stencilMask !== nextRenderState.stencilMask) {
    funcs.push(applyStencilMask);
  }

  if (
    previousRenderState.stencilTest.enabled !== nextRenderState.stencilTest.enabled ||
    previousRenderState.stencilTest.frontFunction !== nextRenderState.stencilTest.frontFunction ||
    previousRenderState.stencilTest.backFunction !== nextRenderState.stencilTest.backFunction ||
    previousRenderState.stencilTest.reference !== nextRenderState.stencilTest.reference ||
    previousRenderState.stencilTest.mask !== nextRenderState.stencilTest.mask ||

    previousRenderState.stencilTest.frontOperation.fail !== nextRenderState.stencilTest.frontOperation.fail ||
    previousRenderState.stencilTest.frontOperation.zFail !== nextRenderState.stencilTest.frontOperation.zFail ||
    previousRenderState.stencilTest.frontOperation.zPass !== nextRenderState.stencilTest.frontOperation.zPass ||

    previousRenderState.stencilTest.backOperation.fail !== nextRenderState.stencilTest.backOperation.fail ||
    previousRenderState.stencilTest.backOperation.zFail !== nextRenderState.stencilTest.backOperation.zFail ||
    previousRenderState.stencilTest.backOperation.zPass !== nextRenderState.stencilTest.backOperation.zPass
  ) {
    funcs.push(applyStencilTest);
  }

  if (
    previousRenderState.sampleCoverage.enabled !== nextRenderState.sampleCoverage.enabled ||
    previousRenderState.sampleCoverage.value !== nextRenderState.sampleCoverage.value ||
    previousRenderState.sampleCoverage.invert !== nextRenderState.sampleCoverage.invert
  ) {
    funcs.push(applySampleCoverage);
  }

  return funcs;
}

function applyFrontFace(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) {
  gl.frontFace(renderState.frontFace);
}

function enableOrDisable(gl: WebGLRenderingContext | WebGL2RenderingContext, glEnum: number, enabled: boolean) {
  if (enabled) {
    gl.enable(glEnum);
  } else {
    gl.disable(glEnum);
  }
}

function applyCull(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) {
  const cull = renderState.cull;
  const enabled = cull.enabled;

  enableOrDisable(gl, gl.CULL_FACE, enabled);

  if (enabled) {
    gl.cullFace(cull.face);
  }
}

function applyDepthTest(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) {
  const depthTest = renderState.depthTest;
  const enabled = depthTest.enabled;

  enableOrDisable(gl, gl.DEPTH_TEST, enabled);

  if (enabled) {
    gl.depthFunc(depthTest.func);
  }
}

function applyLineWidth(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) {
  gl.lineWidth(renderState.lineWidth);
}

function applyPolygonOffset(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) {
  const polygonOffset = renderState.polygonOffset;
  const enabled = polygonOffset.enabled;

  enableOrDisable(gl, gl.POLYGON_OFFSET_FILL, enabled);

  if (enabled) {
    gl.polygonOffset(polygonOffset.factor, polygonOffset.units);
  }
}

function applyScissorTest(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  renderState: RenderState,
  passState: PassState
) {
  const scissorTest = renderState.scissorTest;
  const enabled = defaultValue(passState.scissorTest?.enabled, scissorTest.enabled);

  enableOrDisable(gl, gl.SCISSOR_TEST, enabled);

  if (enabled) {
    const rectangle: BoundingRectangle = defaultValue(passState.scissorTest?.rectangle, scissorTest.rectangle);
    gl.scissor(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  }
}

function applyDepthRange(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) {
  const depthRange = renderState.depthRange;
  gl.depthRange(depthRange.near, depthRange.far);
}

function applyColorMask(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) {
  const colorMask = renderState.colorMask;
  gl.colorMask(colorMask.red, colorMask.green, colorMask.blue, colorMask.alpha);
}

function applyDepthMask(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) {
  gl.depthMask(renderState.depthMask);
}

function applyStencilMask(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) {
  gl.stencilMask(renderState.stencilMask);
}

function applyBlendingColor(gl: WebGLRenderingContext | WebGL2RenderingContext, color: Color) {
  gl.blendColor(color.red, color.green, color.blue, color.alpha);
}

function applyBlending(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState, passState: PassState) {
  const blending = renderState.blending;
  const enabled = defaultValue(passState.blendingEnabled, blending.enabled);

  enableOrDisable(gl, gl.BLEND, enabled);

  if (enabled) {
    applyBlendingColor(gl, blending.color);
    gl.blendEquationSeparate(blending.equationRgb, blending.equationAlpha);
    gl.blendFuncSeparate(
      blending.functionSourceRgb,
      blending.functionDestinationRgb,
      blending.functionSourceAlpha,
      blending.functionDestinationAlpha
    );
  }
}

function applyStencilTest(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) {
  const stencilTest = renderState.stencilTest;
  const enabled = stencilTest.enabled;

  enableOrDisable(gl, gl.STENCIL_TEST, enabled);

  if (enabled) {
    const frontFunction = stencilTest.frontFunction;
    const backFunction = stencilTest.backFunction;
    const reference = stencilTest.reference;
    const mask = stencilTest.mask;

    // Section 6.8 of the WebGL spec requires the reference and masks to be the same for
    // front- and back-face tests.  This call prevents invalid operation errors when calling
    // stencilFuncSeparate on Firefox.  Perhaps they should delay validation to avoid requiring this.
    gl.stencilFunc(frontFunction, reference, mask);
    gl.stencilFuncSeparate(gl.FRONT, frontFunction, reference, mask);
    gl.stencilFuncSeparate(gl.BACK, backFunction, reference, mask);

    const frontOperation = stencilTest.frontOperation;
    const frontOperationFail = frontOperation.fail;
    const frontOperationZFail = frontOperation.zFail;
    const frontOperationZPass = frontOperation.zPass;
    gl.stencilOpSeparate(gl.FRONT, frontOperationFail, frontOperationZFail, frontOperationZPass);

    const backOperation = stencilTest.backOperation;
    const backOperationFail = backOperation.fail;
    const backOperationZFail = backOperation.zFail;
    const backOperationZPass = backOperation.zPass;
    gl.stencilOpSeparate(gl.BACK, backOperationFail, backOperationZFail, backOperationZPass);
  }
}


function applySampleCoverage(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState) {
  const sampleCoverage = renderState.sampleCoverage;
  const enabled = sampleCoverage.enabled;

  enableOrDisable(gl, gl.SAMPLE_COVERAGE, enabled);

  if (enabled) {
    gl.sampleCoverage(sampleCoverage.value, sampleCoverage.invert);
  }
}

const scratchViewport = new BoundingRectangle();
function applyViewport(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState, passState: PassState) {
  let viewport = defaultValue(renderState.viewport, passState.viewport);
  if (!defined(viewport)) {
    viewport = scratchViewport;
    viewport.width = passState.context.drawingBufferWidth;
    viewport.height = passState.context.drawingBufferHeight;
  }

  // passState.context.uniformState.viewport = viewport;
  gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
}

export default RenderState;
