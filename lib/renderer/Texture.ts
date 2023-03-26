import PixelDatatype from "../core/PixelDatatype";
import PixelFormat from "../core/PixelFormat";
import WebGLConstants from "../core/WebGLConstants";
import createGuid from "../core/createGuid";
import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import destroyObject from "../core/destroyObject";
import Cartesian2 from "../math/Cartesian2";
import Context from "./Context";
import Framebuffer from "./Framebuffer";
import MipmapHint from "./MipmapHint";
import Sampler from "./Sampler";
import TextureMagnificationFilter from "./TextureMagnificationFilter";
import TextureMinificationFilter from "./TextureMinificationFilter";
import { TexSource } from "./ITexture";
import toInternalFormat from "../core/toInternalFormat";
import textureSizeInBytes from "../core/textureSizeInBytes";
import alignmentInBytes from "../core/alignmentInBytes";
import flipYForArrayBufferView from "../core/flipYForArrayBufferView";
import pixelDatatypeToWebGLConstant from "../core/pixelDatatypeToWebGLConstant";
import isCompressedFormat from "../core/isCompressedFormat";
import PixelInternalFormat from "../core/PixelInternalFormat";

function compressedTextureSizeInBytes(
  pixelFormat: PixelFormat,
  width: number,
  height: number
) : number {
  switch (pixelFormat) {
    case PixelFormat.RGB_DXT1:
    case PixelFormat.RGBA_DXT1:
    case PixelFormat.RGB_ETC1:
    case PixelFormat.RGB8_ETC2:
      return Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 8;

    case PixelFormat.RGBA_DXT3:
    case PixelFormat.RGBA_DXT5:
    case PixelFormat.RGBA_ASTC:
    case PixelFormat.RGBA8_ETC2_EAC:
      return Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 16;

    case PixelFormat.RGB_PVRTC_4BPPV1:
    case PixelFormat.RGBA_PVRTC_4BPPV1:
      return Math.floor((Math.max(width, 8) * Math.max(height, 8) * 4 + 7) / 8);

    case PixelFormat.RGB_PVRTC_2BPPV1:
    case PixelFormat.RGBA_PVRTC_2BPPV1:
      return Math.floor((Math.max(width, 16) * Math.max(height, 8) * 2 + 7) / 8);

    case PixelFormat.RGBA_BC7:
      return Math.ceil(width / 4) * Math.ceil(height / 4) * 16;

    default:
      return 0;
  }
}

function isDepthFormat(pixelFormat: PixelFormat): boolean {
  return (
    pixelFormat === PixelFormat.DEPTH_COMPONENT ||
    pixelFormat === PixelFormat.DEPTH_STENCIL
  );
}

/**
 * @public
 */
class Texture {
  /** @internal */
  _context: Context;
  /** @internal */
  _textureTarget: number;
  /** @internal */
  _texture: WebGLTexture;
  /** @internal */
  _textureFilterAnisotropic: EXT_texture_filter_anisotropic;

  /** @internal */
  _id: string;
  /** @internal */
  _internalFormat: number;
  /** @internal */
  _width: number;
  /** @internal */
  _height: number;
  /** @internal */
  _pixelFormat: PixelFormat;
  /** @internal */
  _pixelDatatype: PixelDatatype;
  /** @internal */
  _dimensions: Cartesian2;
  /** @internal */
  _hasMipmap: boolean;
  /** @internal */
  _sizeInBytes: number;
  /** @internal */
  _preMultiplyAlpha: boolean;
  /** @internal */
  _flipY: boolean;
  /** @internal */
  _initialized: boolean
  /** @internal */
  _sampler: Sampler;

  public get sampler() : Sampler {
    return this._sampler;
  }
  public set sampler(sampler : Sampler) {
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

    // WebGL 2 depth texture only support nearest filtering. See section 3.8.13 OpenGL ES 3 spec
    if (context._webgl2) {
      if (isDepthFormat(pixelFormat)) {
        minificationFilter = TextureMinificationFilter.NEAREST;
        magnificationFilter = TextureMagnificationFilter.NEAREST;
      }
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

  public get id() : string {
    return this._id;
  }
  public get width() : number {
    return this._width;
  }
  public get height() : number {
    return this._height;
  }
  public get pixelFormat() : PixelFormat {
    return this._pixelFormat;
  }
  public get pixelDatatype() : PixelDatatype {
    return this._pixelDatatype;
  }
  public get dimensions() : Cartesian2 {
    return this._dimensions;
  }
  public get flipY() : boolean {
    return this._flipY;
  }
  public get preMultiplyAlpha() : boolean {
    return this._preMultiplyAlpha;
  }
  public get sizeInByte() : number {
    return this._sizeInBytes;
  }
  /** @internal */
  public get _target() : number {
    return this._textureTarget;
  }

  /**
   * 
   * @param options -
   * @example
   * Create a 1x1 dimension (RGBA, float) texture with initial data:
   * ```js
   * const texture = new Texture({
   *   context: context,
   *   width: 1,
   *   height: 1,
   *   source: {
   *     arrayBufferView: new Float32Array([
   *        1.0, 2.0, 3.0, 4.0,
   *     ]),
   *   },
   *   pixelFormat: PixelFormat.RGBA,
   *   pixelDatatype: PixelDatatype.FLOAT,
   * });
   * ```
   */
  constructor(options: {
    context: Context,
    width?: number,
    height?: number,
    source?: TexSource | TexImageSource;
    internalFormat?: PixelInternalFormat,
    pixelFormat?: PixelFormat,
    pixelDatatype?: PixelDatatype,
    preMultiplyAlpha?: boolean,
    flipY?: boolean,
    skipColorSpaceConversion?: boolean,
    sampler?: Sampler
  }) {
    const context = options.context;
    let width = options.width;
    let height = options.height;
    let source = options.source;

    if (defined(source)) {
      if (!defined(width)) {
        width = defaultValue((source as HTMLVideoElement).videoWidth, source.width);
      }
      if (!defined(height)) {
        height = defaultValue((source as HTMLVideoElement).videoHeight, source.height);
      }
    }

    const pixelFormat = defaultValue(options.pixelFormat, PixelFormat.RGBA);
    const pixelDatatype = defaultValue(options.pixelDatatype, PixelDatatype.UNSIGNED_BYTE);
    const internalFormat = defaultValue(options.internalFormat, toInternalFormat(pixelFormat, pixelDatatype, context));

    // Use premultiplied alpha for opaque textures should perform better on Chrome:
    // http://media.tojicode.com/webglCamp4/#20
    const preMultiplyAlpha =
      options.preMultiplyAlpha ||
      pixelFormat === PixelFormat.RGB ||
      pixelFormat === PixelFormat.LUMINANCE;
    const flipY = defaultValue(options.flipY, true);
    const skipColorSpaceConversion = defaultValue(options.skipColorSpaceConversion, false);

    let initialized = true;

    const gl = context._gl;
    const textureTarget = gl.TEXTURE_2D;
    const texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(textureTarget, texture);

    const isCompressed = isCompressedFormat(pixelFormat);
    let unpackAlignment = 4;
    if (defined(source) && defined((source as TexSource).arrayBufferView) && !isCompressed) {
      unpackAlignment = alignmentInBytes(pixelFormat, pixelDatatype, width);
    }
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);

    if (skipColorSpaceConversion) {
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    } else {
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
    }

    if (defined(source)) {
      if (defined((source as TexSource).arrayBufferView)) {
        source = source as TexSource;

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        let arrayBufferView = source.arrayBufferView as ArrayBufferView;
        let i, mipWidth, mipHeight;
        if (isCompressed) {
          gl.compressedTexImage2D(
            textureTarget,
            0,
            internalFormat,
            width,
            height,
            0,
            arrayBufferView
          );

          if (defined(source.mipLevels)) {
            mipWidth = width;
            mipHeight = height;
            for (i = 0; i < source.mipLevels.length; i++) {
              mipWidth = Math.max(1, Math.floor(mipWidth / 2) | 0);
              mipHeight = Math.max(1, Math.floor(mipHeight / 2) | 0);
              gl.compressedTexImage2D(
                textureTarget,
                i + 1,
                internalFormat,
                mipWidth,
                mipHeight,
                0,
                source.mipLevels[i]
              );
            }
          }
        } else {
          if (flipY) {
            arrayBufferView = flipYForArrayBufferView(
              arrayBufferView,
              pixelFormat,
              pixelDatatype,
              width,
              height
            );
          }
          gl.texImage2D(
            textureTarget,
            0,
            internalFormat,
            width,
            height,
            0,
            pixelFormat,
            pixelDatatypeToWebGLConstant(pixelDatatype, context),
            arrayBufferView
          );

          if (defined(source.mipLevels)) {
            mipWidth = width;
            mipHeight = height;
            for (i = 0; i < source.mipLevels.length; i++) {
              mipWidth = Math.max(1, Math.floor(mipWidth / 2) | 0);
              mipHeight = Math.max(1, Math.floor(mipHeight / 2) | 0);
              gl.texImage2D(
                textureTarget,
                i + 1,
                internalFormat,
                mipWidth,
                mipHeight,
                0,
                pixelFormat,
                pixelDatatypeToWebGLConstant(pixelDatatype, context),
                source.mipLevels[i]
              );
            }
          }
        }
      } else if (defined((source as TexSource).framebuffer)) {
        source = source as TexSource;

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        if (source.framebuffer !== context.defaultFramebuffer) {
          (source.framebuffer as Framebuffer)._bind();
        }

        gl.copyTexImage2D(
          textureTarget,
          0,
          internalFormat,
          source.xOffset,
          source.yOffset,
          width,
          height,
          0
        );

        if (source.framebuffer !== context.defaultFramebuffer) {
          (source.framebuffer as Framebuffer)._unBind();
        }
      } else {  // DOM element upload
        // Only valid for DOM-Element uploads
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, preMultiplyAlpha);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

        gl.texImage2D(
          textureTarget,
          0,
          internalFormat,
          pixelFormat,
          pixelDatatypeToWebGLConstant(pixelDatatype, context),
          source as TexImageSource
        );
      }
    } else {
      gl.texImage2D(
        textureTarget,
        0,
        internalFormat,
        width,
        height,
        0,
        pixelFormat,
        pixelDatatypeToWebGLConstant(pixelDatatype, context),
        null
      );
      initialized = false;
    }
    gl.bindTexture(textureTarget, null);

    let sizeInBytes;
    if (isCompressed) {
      sizeInBytes = compressedTextureSizeInBytes(pixelFormat, width, height);
    } else {
      sizeInBytes = textureSizeInBytes(pixelFormat, pixelDatatype, width, height);
    }

    this._id = createGuid();
    this._context = context;
    this._textureFilterAnisotropic = context._textureFilterAnisotropic;
    this._textureTarget = textureTarget;
    this._texture = texture;
    this._internalFormat = internalFormat;
    this._width = width;
    this._height = height;
    this._pixelFormat = pixelFormat
    this._pixelDatatype = pixelDatatype;
    this._dimensions = new Cartesian2(width, height);
    this._hasMipmap = false;
    this._sizeInBytes = sizeInBytes;
    this._preMultiplyAlpha = preMultiplyAlpha;
    this._flipY = flipY;
    this._initialized = initialized;
    this._sampler = undefined;

    this.sampler = defined(options.sampler) ? options.sampler : new Sampler();
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

  copyFrom(options: {
    xOffset?: number,
    yOffset?: number,
    source: {
      width: number,
      height: number,
      arrayBufferView: ArrayBufferView,
    } | TexImageSource,
    skipColorSpaceConversion?: boolean,
  }) {
    const xOffset = defaultValue(options.xOffset, 0);
    const yOffset = defaultValue(options.yOffset, 0);
    const source = options.source;

    const context = this._context;
    const gl = context._gl;
    const target = this._textureTarget;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(target, this._texture);

    const width = source.width;
    const height = source.height;
    let arrayBufferView = (source as any).arrayBufferView as ArrayBufferView;

    const textureWidth = this._width;
    const textureHeight = this._height;
    const internalFormat = this._internalFormat;
    const pixelFormat = this._pixelFormat;
    const pixelDatatype = this._pixelDatatype;

    const preMultiplyAlpha = this._preMultiplyAlpha;
    const flipY = this._flipY;
    const skipColorSpaceConversion = defaultValue(options.skipColorSpaceConversion, false);

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

    if (xOffset === 0 && yOffset === 0 && width === textureWidth && height === textureHeight) {
      if (defined(arrayBufferView)) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        if (flipY) {
          arrayBufferView = flipYForArrayBufferView(arrayBufferView, pixelFormat, pixelDatatype, width, height);
        }

        gl.texImage2D(
          target,
          0,
          internalFormat,
          textureWidth,
          textureHeight,
          0,
          pixelFormat,
          pixelDatatypeToWebGLConstant(pixelDatatype, context),
          arrayBufferView
        );
      } else {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, preMultiplyAlpha);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

        gl.texImage2D(
          target,
          0,
          internalFormat,
          pixelFormat,
          pixelDatatypeToWebGLConstant(pixelDatatype, context),
          source as TexImageSource
        );
      }
    } else {
      if (defined(arrayBufferView)) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        if (flipY) {
          arrayBufferView = flipYForArrayBufferView(arrayBufferView, pixelFormat, pixelDatatype, width, height);
        }

        gl.texSubImage2D(
          target,
          0,
          xOffset,
          yOffset,
          width,
          height,
          pixelFormat,
          pixelDatatypeToWebGLConstant(pixelDatatype, context),
          arrayBufferView
        );
      } else {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, preMultiplyAlpha);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

        gl.texSubImage2D(
          target,
          0,
          xOffset,
          yOffset,
          pixelFormat,
          pixelDatatypeToWebGLConstant(pixelDatatype, context),
          source as TexImageSource
        );
      }
    }

    gl.bindTexture(target, null);
  }

  /**
   * Copy subimage of framebuffer to texture. When called without arguments,
   * the texture is the same width and height as the framebuffer and contains its contents.
   * @param options -
   * @returns Texture
   */
  static fromFramebuffer(options: {
    context: Context,
    pixelFormat?: PixelFormat,
    framebufferXOffset?: number,
    framebufferYOffset?: number,
    width?: number,
    height?: number,
    framebuffer: Framebuffer,
  }) : Texture {
    const context = options.context;
    const gl = context._gl;

    const pixelFormat = defaultValue(options.pixelFormat, PixelFormat.RGB);
    const framebufferXOffset = defaultValue(options.framebufferXOffset, 0);
    const framebufferYOffset = defaultValue(options.framebufferYOffset, 0);
    const width = defaultValue(options.width, gl.drawingBufferWidth);
    const height = defaultValue(options.height, gl.drawingBufferHeight);
    const framebuffer = options.framebuffer;

    return new Texture({
      context: context,
      width: width,
      height: height,
      pixelFormat: pixelFormat,
      source: {
        framebuffer: defined(framebuffer) ? framebuffer : context.defaultFramebuffer,
        xOffset: framebufferXOffset,
        yOffset: framebufferYOffset,
        width: width,
        height: height,
      },
    });
  }

  isDestroyed() {
    return false;
  }

  destroy() {
    this._context._gl.deleteTexture(this._texture);
    return destroyObject(this);
  }

}

export default Texture;
