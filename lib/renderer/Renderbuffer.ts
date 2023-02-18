import DeveloperError from "../core/DeveloperError";
import RenderbufferFormat from "../core/RenderbufferFormat";
import defaultValue from "../core/defaultValue";
import destroyObject from "../core/destroyObject";
import Context from "./Context";
import ContextLimits from "./ContextLimits";

/**
 * @public
 */
class Renderbuffer {
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _format: RenderbufferFormat;
  _width: number;
  _height: number;
  _renderbuffer: WebGLRenderbuffer;

  public get format() : RenderbufferFormat {
    return this._format;
  }
  public get width() : number {
    return this._width;
  }
  public get height() : number {
    return this._height;
  }

  constructor(options: {
    context: Context,
    format?: RenderbufferFormat,
    width?: number,
    height?: number,
    numSamples?: number
  }) {
    const context = options.context;
    const gl = context._gl;

    const format = defaultValue(options.format, RenderbufferFormat.RGBA4);
    const width = defaultValue(options.width, gl.drawingBufferWidth);
    const height = defaultValue(options.height, gl.drawingBufferHeight);
    const numSamples = defaultValue(options.numSamples, 1);

    const maximumRenderbufferSize = ContextLimits.maximumRenderbufferSize;
    if (width > maximumRenderbufferSize) {
      throw new DeveloperError(`Width must be less than or equal to the maximum renderbuffer size (${maximumRenderbufferSize}), Check maximumRenderbufferSize`);
    }
    if (height > maximumRenderbufferSize) {
      throw new DeveloperError(`Height must be less than or equal to the maximum renderbuffer size (${maximumRenderbufferSize}), Check maximumRenderbufferSize`);
    }

    this._gl = gl;
    this._format = format;
    this._width = width;
    this._height = height;
    this._renderbuffer = gl.createRenderbuffer();

    gl.bindRenderbuffer(gl.RENDERBUFFER, this._renderbuffer);
    if (numSamples > 1 && context.webgl2) {
      (gl as WebGL2RenderingContext ).renderbufferStorageMultisample(
        gl.RENDERBUFFER,
        numSamples,
        format,
        width,
        height
      );
    } else {
      gl.renderbufferStorage(gl.RENDERBUFFER, format, width, height);
    }
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }

  _getRenderbuffer() : WebGLRenderbuffer {
    return this._renderbuffer;
  }

  public isDestroyed() {
    return false;
  }

  public destroy() {
    this._gl.deleteRenderbuffer(this._renderbuffer);
    return destroyObject(this);
  }
}

export default Renderbuffer;
