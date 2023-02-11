import Color from "../core/Color";
import defaultValue from "../core/defaultValue";
import Context from "./Context";
import Framebuffer from "./Framebuffer";
import RenderState from "./RenderState";

/**
 * @public
 */
class ClearCommand {
  color: Color;
  depth: number;
  stencil: number;
  renderState: RenderState; // specify scissor, `gl.clear` does not look at the viewport settings.
  framebuffer;
  owner;

  constructor(options: {
    color?: Color,
    depth?: number,
    stencil?: number,
    renderState?: RenderState,
    framebuffer?: Framebuffer,
    owner?: any,
  } = defaultValue.EMPTY_OBJECT) {
    this.color = options.color;
    this.depth = options.depth;
    this.stencil = options.stencil;
    this.renderState = options.renderState;
    this.framebuffer = options.framebuffer;
    this.owner = options.owner;
  }

  public execute(context: Context) {
    context.clear(this);
  }
}

export default ClearCommand;
