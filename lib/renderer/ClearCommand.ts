import Color from "../core/Color";
import Context from "./Context";
import RenderState from "./RenderState";

class ClearCommand {
  color: Color;
  depth: number;
  stencil: number;
  renderState: RenderState;
  framebuffer;
  owner;

  constructor(options = {
    color: undefined,
    depth: undefined,
    stencil: undefined,
    framebuffer: undefined,
    owner: undefined,
  }) {
    this.color = options.color;
    this.depth = options.depth;
    this.stencil = options.stencil;
    this.framebuffer = options.framebuffer;
    this.owner = options.owner;
  }

  public execute(context: Context) {
    context.clear(this);
  }
}

export default ClearCommand;
