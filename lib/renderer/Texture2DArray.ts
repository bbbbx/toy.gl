import DeveloperError from "../core/DeveloperError";
import PixelDatatype from "../core/PixelDatatype";
import PixelFormat from "../core/PixelFormat";
import WebGLConstants from "../core/WebGLConstants";
import alignmentInBytes from "../core/alignmentInBytes";
import createGuid from "../core/createGuid";
import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import destroyObject from "../core/destroyObject";
import isCompressedFormat from "../core/isCompressedFormat";
import pixelDatatypeToWebGLConstant from "../core/pixelDatatypeToWebGLConstant";
import toInternalFormat from "../core/toInternalFormat";
import Context from "./Context";
import ContextLimits from "./ContextLimits";
import MipmapHint from "./MipmapHint";
import Sampler from "./Sampler";
import TextureMagnificationFilter from "./TextureMagnificationFilter";
import TextureMinificationFilter from "./TextureMinificationFilter";

/**
 * @public
 * Useful for implementing custom terrain rendering systems or other special effects
 * where you need an efficient way of accessing many textures of the same size and format.
 */
class Texture2DArray {
  /** @internal */
  _id: string;
  /** @internal */
  _context: Context;
  /** @internal */
  _textureTarget: number;
  /** @internal */
  _texture: WebGLTexture;
  /** @internal */
  _textureFilterAnisotropic: EXT_texture_filter_anisotropic;

  /** @internal */
  _width: number;
  /** @internal */
  _height: number;
  /** @internal */
  _depth: number;
  /** @internal */
  _pixelFormat: PixelFormat;
  /** @internal */
  _pixelDatatype: PixelDatatype;
  /** @internal */
  _preMultiplyAlpha: boolean;
  /** @internal */
  _flipY: boolean;
  /** @internal */
  _skipColorSpaceConversion: boolean;
  /** @internal */
  _hasMipmap: boolean;
  /** @internal */
  _sampler: Sampler;

  /** @internal */
  public get _target() : WebGLConstants {
    return this._textureTarget
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
  public set sampler(sampler: Sampler) {
    let minificationFilter = sampler.minificationFilter;
    let magnificationFilter = sampler.magnificationFilter;
    const context = this._context;
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
    source?: ArrayBufferView | ArrayBufferView[] | TexImageSource[],
    sampler?: Sampler,
    preMultiplyAlpha?: boolean,
    flipY?: boolean,
    skipColorSpaceConversion?: boolean,
  }) {
    const context = options.context;
    if (!context.webgl2) {
      throw new DeveloperError('2D texture array is only supported in WebGL2.');
    }
    const gl = context._gl as WebGL2RenderingContext;

    const width = options.width;
    const height = options.height;
    const depth = options.depth;

    if (width > ContextLimits.maximumTextureSize) {
      throw new DeveloperError(`Width must be less than or equal to the maximum texture size (${ContextLimits.maximumTextureSize}).  Check ContextLimits.maximumTextureSize.`);
    }
    if (height > ContextLimits.maximumTextureSize) {
      throw new DeveloperError(`Height must be less than or equal to the maximum texture size (${ContextLimits.maximumTextureSize}).  Check ContextLimits.maximumTextureSize.`);
    }
    if (depth > ContextLimits.maximumArrayTextureLayers) {
      throw new DeveloperError(`Depth must be less than or equal to the maximum texture size (${ContextLimits.maximumArrayTextureLayers}).  Check ContextLimits.maximumArrayTextureLayers.`);
    }

    const source = options.source;

    const pixelFormat = defaultValue(options.pixelFormat, PixelFormat.RGBA);
    const pixelDatatype = defaultValue(options.pixelDatatype, PixelDatatype.UNSIGNED_BYTE);
    const internalFormat = toInternalFormat(pixelFormat, pixelDatatype, context);

    const preMultiplyAlpha =
      options.preMultiplyAlpha ||
      pixelFormat === PixelFormat.RGB ||
      pixelFormat === PixelFormat.LUMINANCE;
    const flipY = defaultValue(options.flipY, true);
    const skipColorSpaceConversion = defaultValue(options.skipColorSpaceConversion, false);

    const texture = gl.createTexture();
    const textureTarget = gl.TEXTURE_2D_ARRAY;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(textureTarget, texture);

    const isCompressed = isCompressedFormat(pixelFormat);
    let unpackAlignment = 4;
    if (defined(source) && !isCompressed) {
      unpackAlignment = alignmentInBytes(pixelFormat, pixelDatatype, width);
    }
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);

    if (skipColorSpaceConversion) {
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    } else {
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
    }

    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

    if (Array.isArray(source)) {
      const length = source.length;
      const pixelDatatypeWebGLConstant = pixelDatatypeToWebGLConstant(pixelDatatype, context);
      for (let zOffset = 0; zOffset < length; zOffset++) {
        gl.texSubImage3D(
          textureTarget,
          0,
          0,
          0,
          zOffset,
          width,
          height,
          depth,
          pixelFormat,
          pixelDatatypeWebGLConstant,
          (source[zOffset] as (ArrayBufferView))
        );
      }
    } else {
      gl.texImage3D(
        textureTarget,
        0,
        internalFormat,
        width,
        height,
        depth,
        0,
        pixelFormat,
        pixelDatatypeToWebGLConstant(pixelDatatype, context),
        source
      );
    }

    gl.bindTexture(textureTarget, null);

    this._id = createGuid();
    this._context = context;
    this._textureTarget = textureTarget;
    this._texture =texture;
    this._width = width;
    this._height = height;
    this._depth = depth;
    this._pixelFormat = pixelFormat;
    this._pixelDatatype = pixelDatatype;
    this._preMultiplyAlpha = preMultiplyAlpha;
    this._flipY = flipY;
    this._skipColorSpaceConversion = skipColorSpaceConversion;
    this._textureFilterAnisotropic = context._textureFilterAnisotropic;
    this._sampler = undefined;

    this.sampler = defined(options.sampler) ? options.sampler : new Sampler();
  }

  copyFrom(options: {

  }) {
    throw new Error('To be implemented');
  }

  generateMipmap(hint = MipmapHint.DONT_CARE) {
    this._hasMipmap = true;

    const gl = this._context._gl;
    const target = this._textureTarget;

    gl.hint(gl.GENERATE_MIPMAP_HINT, hint);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(target, this._texture);
    gl.generateMipmap(target);
    gl.bindTexture(target, null);
  }

  isDestroyed() : boolean {
    return false;
  }

  destroy() {
    this._context._gl.deleteTexture(this._texture);
    return destroyObject(this);
  }
}

export default Texture2DArray;
