import Context from "./Context";

class Framebuffer {
  _context: Context;
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _framebuffer: WebGLFramebuffer;
  _activeColorAttachments: number[];

  constructor(options) {
    
  }

  _bind() {
    const gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
  }

  _getActiveColorAttachments() {
    return this._activeColorAttachments;
  }
}

export default Framebuffer;
