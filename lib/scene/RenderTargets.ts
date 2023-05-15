import Context from "../renderer/Context";
import CubeMapFace from "../renderer/CubeMapFace";
import Framebuffer from "../renderer/Framebuffer";
import Renderbuffer from "../renderer/Renderbuffer";
import Texture from "../renderer/Texture";

abstract class RenderTargets {
  context: Context;
  colorBuffers: (Texture | CubeMapFace)[];
  depthBuffer: Texture | Renderbuffer;
  depthStencilBuffer: Texture | Renderbuffer;
  framebuffer: Framebuffer;

  constructor(context: Context) {
    this.context = context;
  }
}

export default RenderTargets;
