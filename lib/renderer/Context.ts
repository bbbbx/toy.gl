import Color from "../core/Color";
import WebGLConstants from "../core/WebGLConstants";
import DeveloperError from "../core/DeveloperError";
import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import ClearCommand from "./ClearCommand";
import ContextLimits from "./ContextLimits";
import DrawCommand from "./DrawCommand";
import Framebuffer from "./Framebuffer";
import RenderState from "./RenderState";
import ShaderCache from "./ShaderCache";
import ShaderProgram from "./ShaderProgram";
import TextureCache from "./TextureCache";
import createGuid from "../core/createGuid";
import PixelDatatype from "../core/PixelDatatype";
import PixelFormat from "../core/PixelFormat";
import getSizeInBytes from "../core/getSizeInBytes";
import getComponentsLength from "../core/getComponentsLength";
import PassState from "./PassState";
import { UniformMap } from "./IDrawCommand";
import RuntimeError from "../core/RuntimeError";

function createTypedArray(pixelFormat: PixelFormat, pixelDatatype: PixelDatatype, width: number, height: number): ArrayBufferView {
  let Constructor;
  const sizeInBytes = getSizeInBytes(pixelDatatype);
  if (sizeInBytes === Uint8Array.BYTES_PER_ELEMENT) {
    Constructor = Uint8Array;
  } else if (sizeInBytes === Uint16Array.BYTES_PER_ELEMENT) {
    Constructor = Uint16Array;
  } else if (sizeInBytes === Float32Array.BYTES_PER_ELEMENT && pixelDatatype === PixelDatatype.FLOAT) {
    Constructor = Float32Array;
  } else {
    Constructor = Uint32Array;
  }

  const size = getComponentsLength(pixelFormat) * width * height;
  return new Constructor(size);
}

function getWebGLContext(
  canvas: HTMLCanvasElement,
  glContextAttributes: WebGLContextAttributes,
  requestWebgl1: boolean
) : WebGLRenderingContext | WebGL2RenderingContext {

  const webgl2Supported = typeof WebGL2RenderingContext !== 'undefined';
  if (!requestWebgl1 && !webgl2Supported) {
    requestWebgl1 = true;
  }

  const contextType = requestWebgl1 ? 'webgl' : 'webgl2';
  const gl = canvas.getContext(contextType, glContextAttributes) as (WebGLRenderingContext | WebGL2RenderingContext | null);

  if (!defined(gl)) {
    throw new RuntimeError('The browser supports WebGL, but initialization failed.');
  }

  return gl;
}

const defaultClearCommand = new ClearCommand();
const defaultFramebufferMarker = {};
/**
 * @public
 */
class Context {
  /** @internal */
  _id: string;

  /** @internal */
  _canvas: HTMLCanvasElement;
  /** @internal */
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  /** @internal */
  _webgl2: boolean;
  /** @internal */
  _stencilBits: number;
  /** @internal */
  _shaderCache: ShaderCache;
  /** @internal */
  _textureCache: TextureCache;

  /** @internal */
  _standardDerivatives: boolean;
  /** @internal */
  _depthTexture: boolean;
  /** @internal */
  _fragDepth: boolean;
  /** @internal */
  _elementIndexUint: boolean;
  /** @internal */
  _debugShaders: WEBGL_debug_shaders;

  /** @internal */
  _textureFloat: boolean;
  /** @internal */
  _textureHalfFloat: boolean;
  /** @internal */
  _textureFloatLinear: boolean;
  /** @internal */
  _textureHalfFloatLinear: boolean;

  /** @internal */
  _colorBufferFloat: boolean;
  /** @internal */
  _colorBufferHalfFloat: boolean;
  /** @internal */
  _floatBlend: boolean;

  /** @internal */
  _textureFilterAnisotropic: EXT_texture_filter_anisotropic;

  /** @internal */
  _vertexArrayObject: boolean;
  /** @internal */
  _instancedArrays: boolean;
  /** @internal */
  _drawBuffers: boolean;

  /** @internal */
  _clearColor: Color;
  /** @internal */
  _clearDepth: number;
  /** @internal */
  _clearStencil: number;

  /** @internal */
  _defaultRenderState: RenderState;
  /** @internal */
  _defaultPassState;

  /** @internal */
  _currentRenderState: RenderState;
  /** @internal */
  _currentPassState: PassState;
  /** @internal */
  _currentFramebuffer: Framebuffer;
  /** @internal */
  _maxFrameTextureUnitIndex: number;

  /** @internal */
  _vertexAttribDivisor: number[];
  /** @internal */
  _previousDrawInstanced: boolean;

  // Validation and logging disabled by default for speed.
  validateFramebuffer = false;
  validateShaderProgram = false;
  logShaderCompilation = false;

  /** @internal */
  _us; // UniformState;

  /** @internal */
  glCreateVertexArray: () => WebGLVertexArrayObject | WebGLVertexArrayObjectOES;
  /** @internal */
  glBindVertexArray: (vertexArray: WebGLVertexArrayObject | WebGLVertexArrayObjectOES) => void;
  /** @internal */
  glDeleteVertexArray: (vertexArray: WebGLVertexArrayObject | WebGLVertexArrayObjectOES) => void;

  /** @internal */
  glDrawElementsInstanced: (mode: number, count: number, type: number, offset: number, instanceCount: number) => void;
  /** @internal */
  glDrawArraysInstanced: (mode: number, first: number, count: number, instanceCount: number) => void;
  /** @internal */
  glVertexAttribDivisor: (index: number, divisor: number) => void;

  /** @internal */
  glDrawBuffers: (buffers: number[]) => void;

  constructor(canvas: HTMLCanvasElement, options: {
    getWebGLStub?: (canvas: HTMLCanvasElement, glContextAttributes: WebGLContextAttributes) => WebGLRenderingContext | WebGL2RenderingContext,
    requestWebgl1?: boolean,
    glContextAttributes?: WebGLContextAttributes,
    allowTextureFilterAnisotropic?: boolean,
  } = {}) {
    this._canvas = canvas;
    const {
      getWebGLStub,
      requestWebgl1,
      glContextAttributes = {},
      allowTextureFilterAnisotropic = true,
    } = defaultValue(options, {});

    const gl = defined(getWebGLStub)
      ? getWebGLStub(canvas, glContextAttributes)
      : getWebGLContext(canvas, glContextAttributes, requestWebgl1);
    const webgl2Supported = typeof WebGL2RenderingContext !== 'undefined';
    const webgl2 = webgl2Supported && gl instanceof WebGL2RenderingContext;

    this._gl = gl;
    this._webgl2 = webgl2;
    this._id = createGuid();

    this._stencilBits = gl.getParameter(gl.STENCIL_BITS);

    this._shaderCache = new ShaderCache(this);
    this._textureCache = new TextureCache();
    
    
    // ContextLimits.xxx = glContext.getParameter(glContext.yy);
    ContextLimits._maximumVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS); // min: 8
    ContextLimits._maximumColorAttachments = this.drawBuffers ? gl.getParameter(WebGLConstants.MAX_COLOR_ATTACHMENTS) : 1;


    // Extensions
    this._standardDerivatives = !!getExtension(gl, ['OES_standard_derivatives']);
    this._depthTexture = !!getExtension(gl, ['WEBGL_depth_texture', 'WEBKIT_WEBGL_depth_texture']);
    this._fragDepth = !!getExtension(gl, ['EXT_frag_depth']);
    this._elementIndexUint = !!getExtension(gl, ['OES_element_index_uint']);
    this._debugShaders = getExtension(gl, ['WEBGL_debug_shaders']);

    this._textureFloat = !!getExtension(gl, ['OES_texture_float']);
    this._textureHalfFloat = !!getExtension(gl, ['OES_texture_half_float']);
    this._textureFloatLinear = !!getExtension(gl, ['OES_texture_float_linear']);
    this._textureHalfFloatLinear = !!getExtension(gl, ['OES_texture_half_float_linear']);

    this._colorBufferFloat = !!getExtension(gl, ['EXT_color_buffer_float', 'WEBGL_color_buffer_float']);
    this._colorBufferHalfFloat = !!getExtension(gl, ['EXT_color_buffer_half_float', 'WEBGL_color_buffer_half_float']);
    this._floatBlend = !!getExtension(gl, ['EXT_float_blend']);

    const textureFilterAnisotropic = allowTextureFilterAnisotropic
      ? getExtension(gl, ['EXT_texture_filter_anisotropic', 'WEBKIT_EXT_texture_filter_anisotropic'])
      : undefined;
    this._textureFilterAnisotropic = textureFilterAnisotropic;

    let glCreateVertexArray: () => WebGLVertexArrayObject | WebGLVertexArrayObjectOES;
    let glBindVertexArray: (vertexArray: WebGLVertexArrayObject | WebGLVertexArrayObjectOES) => void;
    let glDeleteVertexArray: (vertexArray: WebGLVertexArrayObject | WebGLVertexArrayObjectOES) => void;

    let glDrawElementsInstanced: (mode: number, count: number, type: number, offset: number, instanceCount: number) => void;
    let glDrawArraysInstanced: (mode: number, first: number, count: number, instanceCount: number) => void;
    let glVertexAttribDivisor: (index: number, divisor: number) => void;

    let glDrawBuffers: (buffers: number[]) => void;

    let vertexArrayObject: OES_vertex_array_object;
    let instancedArrays: ANGLE_instanced_arrays;
    let drawBuffers: WEBGL_draw_buffers;

    if (webgl2) {
      const context = this;

      glCreateVertexArray = function() {
        return (context._gl as WebGL2RenderingContext).createVertexArray();
      };
      glBindVertexArray = function(vertexArray: WebGLVertexArrayObject) {
        (context._gl as WebGL2RenderingContext).bindVertexArray(vertexArray);
      };
      glDeleteVertexArray = function(vertexArray: WebGLVertexArrayObject) {
        (context._gl as WebGL2RenderingContext).deleteVertexArray(vertexArray);
      };

      glDrawElementsInstanced = function(mode: number, count: number, type: number, offset: number, instanceCount: number) {
        (context._gl as WebGL2RenderingContext).drawElementsInstanced(mode, count, type, offset, instanceCount);
      };
      glDrawArraysInstanced = function(mode: number, first: number, count: number, instanceCount: number) {
        (context._gl as WebGL2RenderingContext).drawArraysInstanced(mode, first, count, instanceCount);
      };
      glVertexAttribDivisor = function(index: number, divisor: number) {
        (context._gl as WebGL2RenderingContext).vertexAttribDivisor(index, divisor);
      };

      glDrawBuffers = function(buffers: number[]) {
        (context._gl as WebGL2RenderingContext).drawBuffers(buffers);
      };
    } else {
      vertexArrayObject = getExtension(gl, ['OES_vertex_array_object']);
      if (defined(vertexArrayObject)) {
        glCreateVertexArray = function() {
          return vertexArrayObject.createVertexArrayOES();
        };
        glBindVertexArray = function(vertexArray: WebGLVertexArrayObjectOES | WebGLVertexArrayObject) {
          vertexArrayObject.bindVertexArrayOES(vertexArray)
        };
        glDeleteVertexArray = function(vertexArray) {
          vertexArrayObject.deleteVertexArrayOES(vertexArray);
        };
      }

      instancedArrays = getExtension(gl, ['ANGLE_instanced_array']);
      if (defined(instancedArrays)) {
        glDrawElementsInstanced = function(mode: number, count: number, type: number, offset: number, instanceCount: number) {
          instancedArrays.drawElementsInstancedANGLE(mode, count, type, offset, instanceCount);
        };
        glDrawArraysInstanced = function(mode: number, first: number, count: number, instanceCount: number) {
          instancedArrays.drawArraysInstancedANGLE(mode, first, count, instanceCount);
        };
        glVertexAttribDivisor = function(index: number, divisor: number) {
          instancedArrays.vertexAttribDivisorANGLE(index, divisor);
        };
      }

      drawBuffers = getExtension(gl, ['WEBGL_draw_buffers']);
      if (defined(drawBuffers)) {
        glDrawBuffers = function(buffers: number[]) {
          drawBuffers.drawBuffersWEBGL(buffers);
        }
      }
    }

    this.glCreateVertexArray = glCreateVertexArray;
    this.glBindVertexArray = glBindVertexArray;
    this.glDeleteVertexArray = glDeleteVertexArray;

    this.glDrawElementsInstanced = glDrawElementsInstanced;
    this.glDrawArraysInstanced = glDrawArraysInstanced;
    this.glVertexAttribDivisor = glVertexAttribDivisor;

    this.glDrawBuffers = glDrawBuffers;

    this._vertexArrayObject = !!vertexArrayObject;
    this._instancedArrays = !!instancedArrays;
    this._drawBuffers = !!drawBuffers;

    this._clearColor = new Color(0.0, 0.0, 0.0, 0.0);
    this._clearDepth = 1.0;
    this._clearStencil = 0;

    const rs = RenderState.fromCache();
    const ps = new PassState(this);

    this._defaultRenderState = rs;
    this._defaultPassState = ps;

    this._currentRenderState = rs;
    this._currentPassState = ps;
    this._currentFramebuffer = undefined;
    this._maxFrameTextureUnitIndex = 0;

    // Vertex attribute divisor state cache. Workaround for ANGLE (also look at VertexArray.setVertexAttribDivisor)
    this._vertexAttribDivisor = [];
    this._previousDrawInstanced = false;
    for (let i = 0; i < ContextLimits._maximumVertexAttributes; i++) {
      this._vertexAttribDivisor.push(0);
    }

    RenderState.apply(gl, rs, ps);
  }

  public get drawingBufferWidth() : number {
    return this._gl.drawingBufferWidth;
  }
  public get drawingBufferHeight() : number {
    return this._gl.drawingBufferHeight;
  }

  public get shaderCache() : ShaderCache {
    return this._shaderCache;
  }

  public get debugShaders() : WEBGL_debug_shaders {
    return this._debugShaders;
  }
  public get vertexArrayObject() : boolean {
    return this._vertexArrayObject;
  }
  public get instancedArrays() : boolean {
    return this._instancedArrays;
  }
  public get drawBuffers() : boolean {
    return this._drawBuffers;
  }
  public get textureFloatLinear() : boolean {
    return this._textureFloatLinear;
  }
  public get textureHalfFloatLinear() : boolean {
    return this._textureHalfFloatLinear;
  }

  public get floatingPointTexture() : boolean {
    return this._textureFloat || this._webgl2;
  }
  public get halfFloatingPointTexture() : boolean {
    return this._textureHalfFloat || this._webgl2;
  }

  public get webgl2() : boolean {
    return this._webgl2;
  }
  public get id() : string {
    return this._id;
  }

  /**
   * Gets an object representing the currently bound framebuffer.  While this instance is not an actual
   * {@link Framebuffer}, it is used to represent the default framebuffer in calls to {@link Texture#fromFramebuffer}.
   */
  public get defaultFramebuffer() : Object {
    return defaultFramebufferMarker;
  }

  clear(
    clearCommand: ClearCommand = defaultClearCommand,
    passState: PassState = this._defaultPassState
  ) {
    const gl = this._gl;
    let bitmask = 0;

    const c = clearCommand.color;
    const d = clearCommand.depth;
    const s = clearCommand.stencil;

    if (defined(c)) {
      if (!Color.equals(this._clearColor, c)) {
        Color.clone(c, this._clearColor);
        gl.clearColor(c.red, c.green, c.blue, c.alpha);
      }
      bitmask |= gl.COLOR_BUFFER_BIT;
    }

    if (defined(d)) {
      if (d !== this._clearDepth) {
        this._clearDepth = d;
        gl.clearDepth(d);
      }
      bitmask |= gl.DEPTH_BUFFER_BIT;
    }

    if (defined(s)) {
      if (s !== this._clearStencil) {
        this._clearStencil = s;
        gl.clearStencil(s);
      }
      bitmask |= gl.STENCIL_BUFFER_BIT;
    }

    const rs = defaultValue(clearCommand.renderState, this._defaultRenderState);
    applyRenderState(this, rs, passState, true);

    const framebuffer = defaultValue(clearCommand.framebuffer, passState.framebuffer);
    bindFramebuffer(this, framebuffer);

    if (bitmask) {
      gl.clear(bitmask);
    }
  }

  public draw(drawCommand: DrawCommand, passState?: PassState, shaderProgram?: ShaderProgram, uniformMap?: UniformMap) {
    passState = defaultValue(passState, this._defaultPassState);
    const framebuffer: Framebuffer = defaultValue(drawCommand.framebuffer, passState.framebuffer);
    const renderState: RenderState = defaultValue(drawCommand.renderState, this._defaultRenderState);

    shaderProgram = defaultValue(shaderProgram, drawCommand._shaderProgram);
    uniformMap = defaultValue(uniformMap, drawCommand._uniformMap);

    beginDraw(this, framebuffer, passState, shaderProgram, renderState);
    continueDraw(this, drawCommand, shaderProgram, uniformMap);
  }

  public readPixels(options: {
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    framebuffer?: Framebuffer,
  }): ArrayBufferView {
    const gl = this._gl;

    const x = defaultValue(options.x, 0);
    const y = defaultValue(options.y, 0);
    const width = defaultValue(options.width, gl.drawingBufferWidth);
    const height = defaultValue(options.height, gl.drawingBufferHeight);
    const framebuffer = options.framebuffer;

    let pixelDatatype = PixelDatatype.UNSIGNED_BYTE;
    if (defined(framebuffer) && framebuffer.numberOfColorAttachments > 0) {
      pixelDatatype = framebuffer.getColorTexture(0).pixelDatatype;
    }
    if (pixelDatatype === PixelDatatype.HALF_FLOAT) {
      pixelDatatype = PixelDatatype.FLOAT;
    }

    const pixels = createTypedArray(PixelFormat.RGBA, pixelDatatype, width, height);

    bindFramebuffer(this, framebuffer);
    gl.readPixels(x, y, width, height, PixelFormat.RGBA, pixelDatatype, pixels);

    return pixels;
  }
}

/**
 * Bind framebuffer and shader program, and apply render state.
 * @param context 
 * @param framebuffer 
 * @param passState 
 * @param shaderProgram 
 * @param renderState 
 */
function beginDraw(context: Context, framebuffer: Framebuffer, passState: PassState, shaderProgram: ShaderProgram, renderState: RenderState) {
  bindFramebuffer(context, framebuffer);
  applyRenderState(context, renderState, passState, false);
  shaderProgram._bind();
  context._maxFrameTextureUnitIndex = Math.max(context._maxFrameTextureUnitIndex, shaderProgram.maximumTextureUnitIndex);
}

/**
 * Set shader program uniforms and bind vertex array, then execute GL draw call.
 * @param context 
 * @param drawCommand 
 * @param shaderProgram 
 * @param uniformMap 
 */
function continueDraw(context: Context, drawCommand: DrawCommand, shaderProgram: ShaderProgram, uniformMap: UniformMap) {
  const primitiveType = drawCommand._primitiveType;
  const va = drawCommand._vertexArray;
  let offset = drawCommand._offset;
  let count = drawCommand._count;
  const instanceCount = drawCommand.instanceCount;

  shaderProgram._setUniforms(uniformMap, context._us, context.validateShaderProgram);

  va._bind();
  const indexBuffer = va._indexBuffer;
  if (defined(indexBuffer)) {
    offset = offset * indexBuffer.bytesPerIndex; // offset in vertices to offset in bytes
    count = defaultValue(count, indexBuffer.numberOfIndices);
    if (instanceCount === 0) {
      context._gl.drawElements(primitiveType, count, indexBuffer.indexDatatype, offset);
    } else {
      context.glDrawElementsInstanced(primitiveType, count, indexBuffer.indexDatatype, offset, instanceCount);
    }
  } else {
    count = defaultValue(count, va.numberOfVertices);
    if (instanceCount === 0) {
      context._gl.drawArrays(primitiveType, offset, count);
    } else {
      context.glDrawArraysInstanced(primitiveType, offset, count, instanceCount);
    }
  }
  va._unBind();
}

function getExtension(gl: WebGLRenderingContext | WebGL2RenderingContext, names: string[]) {
  const length = names.length;
  for (let i = 0; i < length; i++) {
    const extension = gl.getExtension(names[i]);
    if (extension) {
      return extension;
    }
  }
}


let scratchBackBufferArray;
// this check must use typeof, not defined, because defined doesn't work with undeclared variables.
if (typeof WebGLRenderingContext !== "undefined") {
  scratchBackBufferArray = [WebGLConstants.BACK];
}
function bindFramebuffer(context: Context, framebuffer: Framebuffer) {
  if (framebuffer !== context._currentFramebuffer) {
    context._currentFramebuffer = framebuffer;
    let buffers = scratchBackBufferArray;

    if (defined(framebuffer)) {
      framebuffer._bind();
      validateFramebuffer(context);

      // TODO: Need a way for a command to give what draw buffers are active.
      buffers = framebuffer._getActiveColorAttachments();
    } else {
      const gl = context._gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    if (context.drawBuffers) {
      context.glDrawBuffers(buffers);
    }
  }
}

function validateFramebuffer(context) {
  if (context.validateFramebuffer) {
    const gl = context._gl;
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      let message;

      switch (status) {
        case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
          message =
            "Framebuffer is not complete.  Incomplete attachment: at least one attachment point with a renderbuffer or texture attached has its attached object no longer in existence or has an attached image with a width or height of zero, or the color attachment point has a non-color-renderable image attached, or the depth attachment point has a non-depth-renderable image attached, or the stencil attachment point has a non-stencil-renderable image attached.  Color-renderable formats include GL_RGBA4, GL_RGB5_A1, and GL_RGB565. GL_DEPTH_COMPONENT16 is the only depth-renderable format. GL_STENCIL_INDEX8 is the only stencil-renderable format.";
          break;
        case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
          message =
            "Framebuffer is not complete.  Incomplete dimensions: not all attached images have the same width and height.";
          break;
        case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
          message =
            "Framebuffer is not complete.  Missing attachment: no images are attached to the framebuffer.";
          break;
        case gl.FRAMEBUFFER_UNSUPPORTED:
          message =
            "Framebuffer is not complete.  Unsupported: the combination of internal formats of the attached images violates an implementation-dependent set of restrictions.";
          break;
      }

      throw new DeveloperError(message);
    }
  }
}

function applyRenderState(context: Context, renderState: RenderState, passState: PassState, clear: boolean) {
  const previousRenderState = context._currentRenderState;
  const previousPassState = context._currentPassState;
  context._currentRenderState = renderState;
  context._currentPassState = passState;
  RenderState.partialApply(
    context._gl,
    previousRenderState,
    renderState,
    previousPassState,
    passState,
    clear
  );

}

export default Context;
