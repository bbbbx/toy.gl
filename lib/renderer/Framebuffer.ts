import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import destroyObject from "../core/destroyObject";
import Context from "./Context";
import ContextLimits from "./ContextLimits";
import Renderbuffer from "./Renderbuffer";
import Texture from "./Texture";

function attachTexture(framebuffer: Framebuffer, attachment: number, texture: Texture) {
  const gl = framebuffer._gl;
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    attachment,
    texture._target,
    texture._texture,
    0
  );
}

class Framebuffer {
  _context: Context;
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _framebuffer: WebGLFramebuffer;
  _colorTextures: Texture[];
  _colorRenderbuffers: Renderbuffer[];
  _depthTexture: Texture;
  _depthRenderbuffer: Renderbuffer;
  _stencilRenderbuffer: Renderbuffer;
  _depthStencilTexture: Texture;
  _depthStencilRenderbuffer: Renderbuffer;

  _activeColorAttachments: number[];

  destroyAttachments: boolean

  public get numberOfColorAttachments() : number {
    return this._activeColorAttachments.length;
  }

  constructor(options: {
    context: Context,
    colorTextures?: Texture[],
    colorRenderbuffers?: Renderbuffer[],
    depthTexture?: Texture,
    depthRenderbuffer?: Renderbuffer,
    stencilRenderbuffer?: Renderbuffer,
    depthStencilTexture?: Texture,
    depthStencilRenderbuffer?: Renderbuffer,
    destroyAttachments?: boolean,
  }) {
    const context = options.context;
    const gl = context._gl;
    const maximumColorAttachments = ContextLimits.maximumColorAttachments;

    this._gl = gl;
    this._framebuffer = gl.createFramebuffer();

    this._colorTextures = [];
    this._colorRenderbuffers = [];
    this._activeColorAttachments = [];

    this._depthTexture = undefined;
    this._depthRenderbuffer = undefined;
    this._stencilRenderbuffer = undefined;
    this._depthStencilTexture = undefined;
    this._depthStencilRenderbuffer = undefined;

    this.destroyAttachments = defaultValue(options.destroyAttachments, true);

    this._bind();

    let texture;
    let renderbuffer;
    let i;
    let length;
    let attachmentEnum;
    if (defined(options.colorTextures)) {
      const textures = options.colorTextures
      length = this._colorTextures.length = this._activeColorAttachments.length = textures.length;

      for (i = 0; i < length; i++) {
        texture = textures[i];

        attachmentEnum = this._gl.COLOR_ATTACHMENT0 + i;
        attachTexture(this, attachmentEnum, texture);
        this._activeColorAttachments[i] = attachmentEnum;
        this._colorTextures[i] = texture;
      }
    }

    if (defined(options.colorRenderbuffers)) {
      throw new Error("Method not implemented.");
    }

    if (defined(options.depthTexture)) {
      texture = options.depthTexture;

      attachTexture(this, this._gl.DEPTH_ATTACHMENT, texture);
      this._depthTexture = texture;
    }

    if (defined(options.depthRenderbuffer)) {
      throw new Error("Method not implemented.");
    }

    if (defined(options.stencilRenderbuffer)) {
      throw new Error("Method not implemented.");
    }

    if (defined(options.depthStencilTexture)) {
      throw new Error("Method not implemented.");
    }

    if (defined(options.depthStencilRenderbuffer)) {
      throw new Error("Method not implemented.");
    }

    this._unBind();
  }

  _bind() {
    const gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
  }

  _unBind() {
    const gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  _getActiveColorAttachments() {
    return this._activeColorAttachments;
  }

  getColorTexture(index: number): Texture {
    return this._colorTextures[index];
  }

  isDestroy() {
    return false;
  }

  destroy() {
    if (this.destroyAttachments) {
      throw new Error("Method not implemented.");
    }

    this._gl.deleteFramebuffer(this._framebuffer);

    return destroyObject(this);
  }
}

export default Framebuffer;
