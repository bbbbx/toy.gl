import Context from "../renderer/Context";
import Camera from "./Camera";
import DeferredRenderTargets from "./DeferredRenderTargets";

class DeferredRenderer {
  deferredRenderTargets: DeferredRenderTargets;

  constructor(context: Context) {
    this.deferredRenderTargets = new DeferredRenderTargets({
      context: context,
      width: context.drawingBufferWidth,
      height: context.drawingBufferHeight,
    });
  }

  render(camera: Camera) {

  }
}

export default DeferredRenderer;
