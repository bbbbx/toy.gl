import WebGLConstants from "../core/WebGLConstants";
import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import destroyObject from "../core/destroyObject";
import DeveloperError from "../core/DeveloperError";
import PixelFormat from "../core/PixelFormat";
import Context from "./Context";
import ContextLimits from "./ContextLimits";
import Renderbuffer from "./Renderbuffer";
import Texture from "./Texture";
import CubeMapFace from "./CubeMapFace";
import Texture3D from "./Texture3D";
import { CubeMapFaceAttachment, Texture3DAttachment, TextureAttachment } from "./IFramebuffer";

function attachTexture(framebuffer: Framebuffer, attachment: number, texture: Texture | CubeMapFace, level: number = 0) {
  const gl = framebuffer._gl;
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    attachment,
    texture._target,
    texture._texture,
    level
  );
}

function attachTexture3D(framebuffer: Framebuffer, attachment: WebGLConstants, texture: Texture3D, layer: number, level: number = 0) {
  const gl = framebuffer._gl as WebGL2RenderingContext;
  gl.framebufferTextureLayer(
    gl.FRAMEBUFFER,
    attachment,
    texture._texture,
    level,
    layer
  );
}

function attachRenderbuffer(framebuffer: Framebuffer, attachmentEnum: WebGLConstants, renderbuffer: Renderbuffer) {
  const gl = framebuffer._gl;
  gl.framebufferRenderbuffer(
    gl.FRAMEBUFFER,
    attachmentEnum,
    gl.RENDERBUFFER,
    renderbuffer._getRenderbuffer()
  );
}

/**
 * @public
 */
class Framebuffer {
  /** @internal */
  _context: Context;
  /** @internal */
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  /** @internal */
  _framebuffer: WebGLFramebuffer;
  /** @internal */
  _colorTextures: (Texture | CubeMapFace | Texture3D)[];
  /** @internal */
  _colorRenderbuffers: Renderbuffer[];
  /** @internal */
  _depthTexture: Texture;
  /** @internal */
  _depthRenderbuffer: Renderbuffer;
  /** @internal */
  _stencilRenderbuffer: Renderbuffer;
  /** @internal */
  _depthStencilTexture: Texture;
  /** @internal */
  _depthStencilRenderbuffer: Renderbuffer;
  /** @internal */
  _activeColorAttachments: number[];

  /**
   * When true, the framebuffer owns its attachments so they will be destroyed when
   * {@link Framebuffer.destroy} is called or when a new attachment is assigned to an attachment point.
   */
  destroyAttachments: boolean

  public get numberOfColorAttachments() : number {
    return this._activeColorAttachments.length;
  }

  constructor(options: {
    context: Context,
    colorTextures?: (Texture | TextureAttachment | CubeMapFaceAttachment | Texture3DAttachment)[],
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

    let texture: Texture | TextureAttachment | CubeMapFaceAttachment | Texture3DAttachment;
    let i: number;
    let length: number;
    let attachmentEnum: WebGLConstants;
    if (defined(options.colorTextures)) {
      const textures = options.colorTextures;
      length = this._colorTextures.length = this._activeColorAttachments.length = textures.length;

      if (length > maximumColorAttachments) {
        throw new DeveloperError('The number of color attachments exceeds the number supported.');
      }

      for (i = 0; i < length; i++) {
        texture = textures[i];

        attachmentEnum = this._gl.COLOR_ATTACHMENT0 + i;
        if (texture instanceof Texture) {

          attachTexture(this, attachmentEnum, texture, 0);
          this._colorTextures[i] = texture;

        } else if (defined((texture as TextureAttachment).texture)) {

          texture = texture as TextureAttachment;
          attachTexture(this, attachmentEnum, texture.texture, texture.level);
          this._colorTextures[i] = texture.texture;

        } else if (defined((texture as CubeMapFaceAttachment).cubeMapFace)) {

          texture = texture as CubeMapFaceAttachment;
          attachTexture(this, attachmentEnum, texture.cubeMapFace, texture.level);
          this._colorTextures[i] = texture.cubeMapFace;

        } else if (defined((texture as Texture3DAttachment).texture3D)) {

          texture = texture as Texture3DAttachment;
          attachTexture3D(this, attachmentEnum, texture.texture3D, texture.layer, texture.level);
          this._colorTextures[i] = texture.texture3D;

        }

        this._activeColorAttachments[i] = attachmentEnum;
      }
    }

    let renderbuffer: Renderbuffer;
    if (defined(options.colorRenderbuffers)) {
      const renderbuffers = options.colorRenderbuffers;
      length = this._colorRenderbuffers.length = this._activeColorAttachments.length = renderbuffers.length;

      if (length > maximumColorAttachments) {
        throw new DeveloperError('The number of color attachments exceeds the number supported.');
      }

      for (i = 0; i < length; i++) {
        renderbuffer = renderbuffers[i];
        attachmentEnum = this._gl.COLOR_ATTACHMENT0 + i;

        attachRenderbuffer(this, attachmentEnum, renderbuffer);
        this._activeColorAttachments[i] = attachmentEnum;
        this._colorRenderbuffers[i] = renderbuffer;
      }
    }

    if (defined(options.depthTexture)) {
      texture = options.depthTexture;

      attachTexture(this, this._gl.DEPTH_ATTACHMENT, texture, 0);
      this._depthTexture = texture;
    }

    if (defined(options.depthRenderbuffer)) {
      renderbuffer = options.depthRenderbuffer;
      attachRenderbuffer(this, gl.DEPTH_ATTACHMENT, renderbuffer);
      this._depthRenderbuffer = renderbuffer;
    }

    if (defined(options.stencilRenderbuffer)) {
      renderbuffer = options.stencilRenderbuffer;
      attachRenderbuffer(this, gl.STENCIL_ATTACHMENT, renderbuffer);
      this._stencilRenderbuffer = renderbuffer;
    }

    if (defined(options.depthStencilTexture)) {
      texture = options.depthStencilTexture;
      if (texture.pixelFormat !== PixelFormat.DEPTH_STENCIL) {
        throw new DeveloperError('The depth-stencil pixel-format must be DEPTH_STENCIL.');
      }
      attachTexture(this, gl.DEPTH_STENCIL_ATTACHMENT, texture, 0);
      this._depthStencilTexture = texture;
    }

    if (defined(options.depthStencilRenderbuffer)) {
      renderbuffer = options.depthStencilRenderbuffer;
      attachRenderbuffer(this, gl.DEPTH_STENCIL_ATTACHMENT, renderbuffer);
      this._depthStencilRenderbuffer = renderbuffer;
    }

    this._unBind();
  }

  /** @internal */
  _bind() {
    const gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer);
  }

  /** @internal */
  _unBind() {
    const gl = this._gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  /** @internal */
  _getActiveColorAttachments() {
    return this._activeColorAttachments;
  }

  /**
   * WebGL2 only.
   */
  bindDraw() {
    const gl = this._gl as WebGL2RenderingContext;
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this._framebuffer);
  }

  /**
   * WebGL2 only.
   */
  bindRead() {
    const gl = this._gl as WebGL2RenderingContext;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this._framebuffer);
  }

  getColorTexture(index: number): Texture | CubeMapFace | Texture3D {
    return this._colorTextures[index];
  }

  isDestroyed() {
    return false;
  }

  destroy() {
    if (this.destroyAttachments) {
      const textures = this._colorTextures;
      let length = textures.length;
      for (let i = 0; i < length; i++) {
        const texture = textures[i];
        if (defined(texture)) {
          texture.destroy();
        }
      }

      const renderbuffers = this._colorRenderbuffers;
      length = renderbuffers.length;
      for (let i = 0; i < length; i++) {
        const renderbuffer = renderbuffers[i];
        if (defined(renderbuffer)) {
          renderbuffer.destroy();
        }
      }

      this._depthTexture = this._depthTexture?.destroy();
      this._depthRenderbuffer = this._depthRenderbuffer?.destroy();
      this._stencilRenderbuffer = this._stencilRenderbuffer?.destroy();
      this._depthStencilTexture = this._depthStencilTexture?.destroy();
      this._depthStencilRenderbuffer = this._depthStencilRenderbuffer?.destroy();
    }

    this._gl.deleteFramebuffer(this._framebuffer);

    return destroyObject(this);
  }
}

export default Framebuffer;
