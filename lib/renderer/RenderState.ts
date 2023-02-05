import WebGLConstant from "../core/WebGLConstant";
import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import CullFace from "../core/CullFace";
import WindingOrder from "../core/WindingOrder";
import BoundingRectangle from "../core/BoundingRectangle";

let nextRenderStateId = 0;
const renderStateCache: {
  [key: string]: {
    referenceCount: number,
    state: RenderState,
  }
} = {};

class RenderState {
  frontFace: WindingOrder;
  cull: {
    enabled: boolean,
    face: CullFace,
  };
  depthTest: {
    enabled: boolean,
    func: CullFace,
  };
  viewport: BoundingRectangle;

  id: number;
  _applyFunctions: (() => void)[][];

  constructor(renderState) {
    const rs = defaultValue(renderState, defaultValue.EMPTY_OBJECT);
    const cull = defaultValue(rs.cull, defaultValue.EMPTY_OBJECT);
    const depthTest = defaultValue(rs.depthTest, defaultValue.EMPTY_OBJECT);
    const viewport = rs.viewport;

    this.frontFace = defaultValue(rs.frontFace, WindingOrder.COUNTER_CLOCKWISE);
    this.cull = {
      enabled: defaultValue(cull.enabled, false),
      face: defaultValue(cull.face, CullFace.BACK),
    };
    this.depthTest = {
      enabled: defaultValue(depthTest.enabled, false),
      func: defaultValue(depthTest.func, WebGLConstant.LESS),
    };
    this.viewport = defined(viewport)
      ? new BoundingRectangle(viewport.x, viewport.y, viewport.width, viewport.height)
      : undefined;

    this.id = 0;
    this._applyFunctions = [];
  }

  static fromCache(renderState?): RenderState {
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

  static partialApply(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    previousRenderState: RenderState,
    renderState: RenderState,
    previousPassState,
    passState,
    clear?: boolean
  ) {
    if (previousRenderState !== renderState) {
      // TODO:
    }

    if (
      previousRenderState !== renderState ||
      previousPassState !== previousPassState ||
      previousPassState.context !== passState.context
    ) {
      applyViewport(gl, renderState, passState);
    }
    applyCull(gl, renderState);
    applyDepthTest(gl, renderState);
  }

  static apply(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState, passState) {
    applyFrontFace(gl, renderState);
    applyCull(gl, renderState);
    applyDepthTest(gl, renderState);
    applyViewport(gl, renderState, passState);
  }

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

const scratchViewport = new BoundingRectangle();
function applyViewport(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  renderState: RenderState,
  passState
) {
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
