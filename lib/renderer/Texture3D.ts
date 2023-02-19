import DeveloperError from "../core/DeveloperError";
import PixelDatatype from "../core/PixelDatatype";
import PixelFormat from "../core/PixelFormat";
import WebGLConstants from "../core/WebGLConstants";
import alignmentInBytes from "../core/alignmentInBytes";
import createGuid from "../core/createGuid";
import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import destroyObject from "../core/destroyObject";
import toInternalFormat from "../core/toInternalFormat";
import Context from "./Context";
import Sampler from "./Sampler";
import TextureMagnificationFilter from "./TextureMagnificationFilter";
import TextureMinificationFilter from "./TextureMinificationFilter";

/**
 * @public
 */
class Texture3D {
  /** @internal */
  _id: string;
  /** @internal */
  _context: Context;
  /** @internal */
  _texture: WebGLTexture;
  /** @internal */
  _textureTarget: WebGLConstants;
  /** @internal */
  _pixelFormat: PixelFormat;
  /** @internal */
  _pixelDatatype: PixelDatatype;
  /** @internal */
  _internalFormat: WebGLConstants;
  /** @internal */
  _width: number;
  /** @internal */
  _height: number;
  /** @internal */
  _depth: number;
  /** @internal */
  _textureFilterAnisotropic: EXT_texture_filter_anisotropic;
  /** @internal */
  _sampler: Sampler;

  public get _target() : WebGLConstants {
    return this._textureTarget;
  }

  public get id() : string {
    return this._id;
  }
  public get width() : number {
    return this._width;
  }
  public get height() : number {
    return this._height;
  }
  public get depth() : number {
    return this._depth;
  }
  public get pixelFormat() : PixelFormat {
    return this._pixelFormat;
  }
  public get pixelDatatype() : PixelDatatype {
    return this._pixelDatatype;
  }

  public get sampler() : Sampler {
    return this._sampler;
  }
  public set sampler(sampler) {
    let minificationFilter = sampler.minificationFilter;
    let magnificationFilter = sampler.magnificationFilter;
    const context = this._context;
    const pixelFormat = this._pixelFormat;
    const pixelDatatype = this._pixelDatatype;

    const mipmap =
      minificationFilter === TextureMinificationFilter.NEAREST_MIPMAP_NEAREST ||
      minificationFilter === TextureMinificationFilter.NEAREST_MIPMAP_LINEAR ||
      minificationFilter === TextureMinificationFilter.LINEAR_MIPMAP_NEAREST ||
      minificationFilter === TextureMinificationFilter.LINEAR_MIPMAP_LINEAR;

    // float textures only support nearest filtering unless the linear extensions are supported, so override the sampler's settings
    if (
      (pixelDatatype === PixelDatatype.FLOAT && !context.textureFloatLinear) ||
      (pixelDatatype === PixelDatatype.HALF_FLOAT && !context.textureHalfFloatLinear)
    ) {
      minificationFilter = mipmap
        ? TextureMinificationFilter.NEAREST_MIPMAP_NEAREST
        : TextureMinificationFilter.NEAREST;
      magnificationFilter = TextureMagnificationFilter.NEAREST;
    }

    const gl = context._gl as WebGL2RenderingContext;
    const target = this._textureTarget;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(target, this._texture);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, sampler.wrapS);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, sampler.wrapT);
    gl.texParameteri(target, gl.TEXTURE_WRAP_R, sampler.wrapR);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, minificationFilter);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, magnificationFilter);
    if (defined(this._textureFilterAnisotropic)) {
      gl.texParameteri(target, this._textureFilterAnisotropic.TEXTURE_MAX_ANISOTROPY_EXT, sampler.maximumAnisotropy);
    }
    gl.bindTexture(target, null);

    this._sampler = sampler;
  }

  constructor(options: {
    context: Context,
    width: number,
    height: number,
    depth: number,
    pixelFormat: PixelFormat,
    pixelDatatype: PixelDatatype,
    source?: ArrayBufferView,
    sampler?: Sampler,
  }) {
    const context = options.context;
    if (!context.webgl2) {
      throw new DeveloperError('3D texture is only supported in WebGL2.');
    }

    const width = options.width;
    const height = options.height;
    const depth = options.depth;
    const source = options.source;
    const pixelFormat = options.pixelFormat;
    const pixelDatatype = options.pixelDatatype;
    const internalFormat = toInternalFormat(pixelFormat, pixelDatatype, context);

    const gl = context._gl as WebGL2RenderingContext;
    const texture = gl.createTexture();

    const textureTarget = gl.TEXTURE_3D;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(textureTarget, texture);

    const unpackAlignment = alignmentInBytes(pixelFormat, pixelDatatype, width);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    gl.texImage3D(textureTarget, 0, internalFormat, width, height, depth, 0, pixelFormat, pixelDatatype, source);
    gl.bindTexture(textureTarget, null);

    this._id = createGuid();
    this._context = context;
    this._texture = texture;
    this._textureTarget = textureTarget;
    this._width = width;
    this._height = height;
    this._depth = depth;
    this._pixelFormat = pixelFormat;
    this._pixelDatatype = pixelDatatype;
    this._internalFormat = internalFormat;
    this._textureFilterAnisotropic = context._textureFilterAnisotropic;
    this._sampler = undefined;

    this.sampler = defaultValue(options.sampler, new Sampler());
  }

  isDestroyed() {
    return false;
  }

  destroy() {
    this._context._gl.deleteTexture(this._texture);
    return destroyObject(this);
  }
}

export default Texture3D;
