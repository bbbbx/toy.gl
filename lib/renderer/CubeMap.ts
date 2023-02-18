import DeveloperError from "../core/DeveloperError";
import PixelDatatype from "../core/PixelDatatype";
import PixelFormat from "../core/PixelFormat";
import WebGLConstants from "../core/WebGLConstants";
import alignmentInBytes from "../core/alignmentInBytes";
import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import destroyObject from "../core/destroyObject";
import flipYForArrayBufferView from "../core/flipYForArrayBufferView";
import pixelDatatypeToWebGLConstant from "../core/pixelDatatypeToWebGLConstant";
import textureSizeInBytes from "../core/textureSizeInBytes";
import toInternalFormat from "../core/toInternalFormat";
import Context from "./Context";
import ContextLimits from "./ContextLimits";
import CubeMapFace from "./CubeMapFace";
import { TexSource } from "./ITexture";
import MipmapHint from "./MipmapHint";
import Sampler from "./Sampler";
import TextureMagnificationFilter from "./TextureMagnificationFilter";
import TextureMinificationFilter from "./TextureMinificationFilter";

/**
 * @public
 */
class CubeMap {
  /** @internal */
  _context: Context;
  /** @internal */
  _textureTarget: number;
  /** @internal */
  _texture: WebGLTexture;
  /** @internal */
  _textureFilterAnisotropic: EXT_texture_filter_anisotropic;

  /** @internal */
  _pixelFormat: PixelFormat;
  /** @internal */
  _pixelDatatype: PixelDatatype;
  /** @internal */
  _size: number;
  /** @internal */
  _hasMipmap: boolean;
  /** @internal */
  _sizeInBytes: number;
  /** @internal */
  _preMultiplyAlpha: boolean;
  /** @internal */
  _flipY: boolean;
  /** @internal */
  _sampler: Sampler;

  /** @internal */
  _positiveX: CubeMapFace;
  /** @internal */
  _negativeX: CubeMapFace;
  /** @internal */
  _positiveY: CubeMapFace;
  /** @internal */
  _negativeY: CubeMapFace;
  /** @internal */
  _positiveZ: CubeMapFace;
  /** @internal */
  _negativeZ: CubeMapFace;

  
  public get positiveX() : CubeMapFace {
    return this._positiveX;
  }
  public get negativeX() : CubeMapFace {
    return this._negativeX;
  }
  public get positiveY() : CubeMapFace {
    return this._positiveY;
  }
  public get negativeY() : CubeMapFace {
    return this._negativeY;
  }
  public get positiveZ() : CubeMapFace {
    return this._positiveZ;
  }
  public get negativeZ() : CubeMapFace {
    return this._negativeZ;
  }
  
  public get pixelFormat() : PixelFormat {
    return this._pixelFormat;
  }
  public get pixelDatatype() : PixelDatatype {
    return this._pixelDatatype;
  }
  public get width() : number {
    return this._size;
  }
  public get height() : number {
    return this._size;
  }
  public get sizeInBytes() : number {
    return this._sizeInBytes;
  }
  public get preMultiplyAlpha() : boolean {
    return this._preMultiplyAlpha;
  }
  public get flipY() : boolean {
    return this._flipY;
  }
  public get _target() : number {
    return this._textureTarget;
  }

  public get sampler() : Sampler {
    return this._sampler;
  }
  public set sampler(sampler: Sampler) {
    let minificationFilter = sampler.minificationFilter;
    let magnificationFilter = sampler.magnificationFilter;

    const mipmap =
      minificationFilter === TextureMinificationFilter.NEAREST_MIPMAP_NEAREST ||
      minificationFilter === TextureMinificationFilter.NEAREST_MIPMAP_LINEAR ||
      minificationFilter === TextureMinificationFilter.LINEAR_MIPMAP_NEAREST ||
      minificationFilter === TextureMinificationFilter.LINEAR_MIPMAP_LINEAR;

    const context = this._context;
    const pixelDatatype = this._pixelDatatype;

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

    const gl = context._gl;
    const target = this._textureTarget;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(target, this._texture);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, sampler.wrapS);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, sampler.wrapT);
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
    pixelFormat?: PixelFormat,
    pixelDatatype?: PixelDatatype,
    source?: {
      positiveX: TexSource,
      negativeX: TexSource,
      positiveY: TexSource,
      negativeY: TexSource,
      positiveZ: TexSource,
      negativeZ: TexSource,
    },
    preMultiplyAlpha?: boolean,
    flipY?: boolean,
    skipColorSpaceConversion?: boolean,
    sampler?: Sampler,
  }) {
    const context = options.context;
    const source = options.source;
    const width = options.width;
    const height = options.height;

    if (!defined(width) || !defined(height)) {
      throw new DeveloperError('options requires a source field to create an initialized cube map or width and height fields to create a blank cube map.');
    }

    if (width !== height) {
      throw new DeveloperError('Width must equal height.');
    }

    const size = width;
    if (size > ContextLimits.maximumCubeMapSize) {
      throw new DeveloperError(`Width and height must be less than or equal to the maximum cube map size (${ContextLimits.maximumCubeMapSize}).  Check maximumCubeMapSize.`);
    }

    const pixelDatatype = defaultValue(options.pixelDatatype, PixelDatatype.UNSIGNED_BYTE);
    const pixelFormat = defaultValue(options.pixelFormat, PixelFormat.RGBA);
    const internalFormat = toInternalFormat(pixelFormat, pixelDatatype, context);

    const sizeInBytes = textureSizeInBytes(pixelFormat, pixelDatatype, width, height) * 6;

    // Use premultiplied alpha for opaque textures should perform better on Chrome:
    // http://media.tojicode.com/webglCamp4/#20
    const preMultiplyAlpha = options.preMultiplyAlpha || pixelFormat === PixelFormat.RGB || pixelFormat === PixelFormat.LUMINANCE;
    const flipY = defaultValue(options.flipY, true);
    const skipColorSpaceConversion = defaultValue(options.skipColorSpaceConversion, false);

    const gl = context._gl;
    const textureTarget = gl.TEXTURE_CUBE_MAP;
    const texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(textureTarget, texture);

    function createFace(
      target: WebGLConstants.TEXTURE_CUBE_MAP_POSITIVE_X | WebGLConstants.TEXTURE_CUBE_MAP_NEGATIVE_X | WebGLConstants.TEXTURE_CUBE_MAP_POSITIVE_Y | WebGLConstants.TEXTURE_CUBE_MAP_NEGATIVE_Y | WebGLConstants.TEXTURE_CUBE_MAP_POSITIVE_Z | WebGLConstants.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      sourceFace: TexSource | TexImageSource,
      preMultiplyAlpha: boolean,
      flipY: boolean,
      skipColorSpaceConversion: boolean
    ) {
      let arrayBufferView = (sourceFace as TexSource).arrayBufferView as ArrayBufferView;
      if (!defined(arrayBufferView)) {
        //TODO:
        // arrayBufferView = sourceFace.bufferView;
      }

      let unpackAlignment = 4;
      if (defined(arrayBufferView)) {
        unpackAlignment = alignmentInBytes(pixelFormat, pixelDatatype, width);
      }

      gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);

      if (skipColorSpaceConversion) {
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      } else {
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
      }

      if (defined(arrayBufferView)) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        if (flipY) {
          arrayBufferView = flipYForArrayBufferView(arrayBufferView as ArrayBufferView, pixelFormat, pixelDatatype, width, height);
        }
        gl.texImage2D(
          target,
          0,
          internalFormat,
          size,
          size,
          0,
          pixelFormat,
          pixelDatatypeToWebGLConstant(pixelDatatype, context),
          arrayBufferView
        )
      } else {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, preMultiplyAlpha);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

        gl.texImage2D(
          target,
          0,
          internalFormat,
          pixelFormat,
          pixelDatatypeToWebGLConstant(pixelDatatype, context),
          sourceFace as TexImageSource
        );
      }
    }

    if (defined(source)) {
      createFace(gl.TEXTURE_CUBE_MAP_POSITIVE_X, source.positiveX, preMultiplyAlpha, flipY, skipColorSpaceConversion);
      createFace(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, source.negativeX, preMultiplyAlpha, flipY, skipColorSpaceConversion);
      createFace(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, source.positiveY, preMultiplyAlpha, flipY, skipColorSpaceConversion);
      createFace(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, source.negativeY, preMultiplyAlpha, flipY, skipColorSpaceConversion);
      createFace(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, source.positiveZ, preMultiplyAlpha, flipY, skipColorSpaceConversion);
      createFace(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, source.negativeZ, preMultiplyAlpha, flipY, skipColorSpaceConversion);
    } else {
      const type = pixelDatatypeToWebGLConstant(pixelDatatype, context);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, internalFormat, size, size, 0, pixelFormat, type, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, internalFormat, size, size, 0, pixelFormat, type, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, internalFormat, size, size, 0, pixelFormat, type, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, internalFormat, size, size, 0, pixelFormat, type, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, internalFormat, size, size, 0, pixelFormat, type, null);
      gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, internalFormat, size, size, 0, pixelFormat, type, null);
    }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    this._context = context;
    this._textureFilterAnisotropic = context._textureFilterAnisotropic;
    this._textureTarget = textureTarget;
    this._texture = texture;
    this._pixelFormat = pixelFormat;
    this._pixelDatatype = pixelDatatype;
    this._size = size;
    this._hasMipmap = false;
    this._sizeInBytes = sizeInBytes;
    this._preMultiplyAlpha = preMultiplyAlpha;
    this._flipY = flipY;
    this._sampler = undefined;

    const initialized = defined(source);
    this._positiveX = new CubeMapFace(context, texture, textureTarget, gl.TEXTURE_CUBE_MAP_POSITIVE_X, internalFormat, pixelFormat, pixelDatatype, size, preMultiplyAlpha, flipY, initialized);
    this._negativeX = new CubeMapFace(context, texture, textureTarget, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, internalFormat, pixelFormat, pixelDatatype, size, preMultiplyAlpha, flipY, initialized);
    this._positiveY = new CubeMapFace(context, texture, textureTarget, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, internalFormat, pixelFormat, pixelDatatype, size, preMultiplyAlpha, flipY, initialized);
    this._negativeY = new CubeMapFace(context, texture, textureTarget, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, internalFormat, pixelFormat, pixelDatatype, size, preMultiplyAlpha, flipY, initialized);
    this._positiveZ = new CubeMapFace(context, texture, textureTarget, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, internalFormat, pixelFormat, pixelDatatype, size, preMultiplyAlpha, flipY, initialized);
    this._negativeZ = new CubeMapFace(context, texture, textureTarget, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, internalFormat, pixelFormat, pixelDatatype, size, preMultiplyAlpha, flipY, initialized);

    this.sampler = defaultValue(options.sampler, new Sampler());
  }

  public generateMipmap(hint: MipmapHint = MipmapHint.DONT_CARE) {
    this._hasMipmap = true;

    const gl = this._context._gl;
    const target = this._textureTarget;

    gl.hint(gl.GENERATE_MIPMAP_HINT, hint);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(target, this._texture);
    gl.generateMipmap(target);
    gl.bindTexture(target, null);
  }

  isDestroyed() {
    return false;
  }

  destroy() {
    this._context._gl.deleteTexture(this._texture);
    this._positiveX = destroyObject(this._positiveX);
    this._negativeX = destroyObject(this._negativeX);
    this._positiveY = destroyObject(this._positiveY);
    this._negativeY = destroyObject(this._negativeY);
    this._positiveZ = destroyObject(this._positiveZ);
    this._negativeZ = destroyObject(this._negativeZ);
    return destroyObject(this);
  }
}

export default CubeMap;
