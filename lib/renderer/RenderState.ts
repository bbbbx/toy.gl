import WebGLConstant from "../core/WebGLConstant";
import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import CullFace from "../core/CullFace";
import WindingOrder from "../core/WindingOrder";

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

  id: number;

  constructor(renderState) {
    const rs = defaultValue(renderState, defaultValue.EMPTY_OBJECT);
    const cull = defaultValue(rs.cull, defaultValue.EMPTY_OBJECT);

    this.frontFace = defaultValue(rs.frontFace, WindingOrder.COUNTER_CLOCKWISE);
    this.cull = {
      enabled: defaultValue(cull.enabled, false),
      face: defaultValue(cull.face, CullFace.BACK),
    };

    this.id = 0;
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

    }
  }

  static apply(gl: WebGLRenderingContext | WebGL2RenderingContext, renderState: RenderState, passState) {
    applyFrontFace(gl, renderState);
    applyCull(gl, renderState);
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

export default RenderState;
