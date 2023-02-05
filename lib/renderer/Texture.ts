import PixelDatatype from "../core/PixelDatatype";
import PixelFormat from "../core/PixelFormat";
import WebGLConstant from "../core/WebGLConstant";
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

function toInternalFormat(
  pixelFormat: PixelFormat,
  pixelDatatype: PixelDatatype,
  context: Context
) : number {
  // WebGL 1 require internal format to be the same as format
  if (!context.webgl2) {
    return pixelFormat as number;
  }

  if (pixelFormat === PixelFormat.DEPTH_STENCIL) {
    return WebGLConstant.DEPTH24_STENCIL8;
  }

  if (pixelFormat === PixelFormat.DEPTH_COMPONENT) {
    if (pixelDatatype === PixelDatatype.UNSIGNED_SHORT) {
      return WebGLConstant.DEPTH_COMPONENT16;
    } else if (pixelDatatype === PixelDatatype.UNSIGNED_INT) {
      return WebGLConstant.DEPTH_COMPONENT24;
    }
  }

  if (pixelDatatype === PixelDatatype.FLOAT) {
    switch (pixelFormat) {
      case PixelFormat.RGBA:
        return WebGLConstant.RGBA32F;
      case PixelFormat.RGB:
        return WebGLConstant.RGB32F;
      // case PixelFormat.RG:
      //   return WebGLConstant.RG32F;
      // case PixelFormat.R
      //   return WebGLConstant.R32F;
    }
  }

  if (pixelDatatype === PixelDatatype.HALF_FLOAT) {
    switch (pixelFormat) {
      case PixelFormat.RGBA:
        return WebGLConstant.RGBA16F;
      case PixelFormat.RGB:
        return WebGLConstant.RGB16F;
      // case PixelFormat.RG:
      //   return WebGLConstant.RG16F;
      // case PixelFormat.R
      //   return WebGLConstant.R16F;
    }
  }

  return pixelFormat;
}

function getComponentsLength(pixelFormat: PixelFormat): number {
  switch (pixelFormat) {
    case PixelFormat.RGBA:
      return 4;
    case PixelFormat.RGB:
      return 3;
    case PixelFormat.LUMINANCE_ALPHA:
      return 2;
    case PixelFormat.LUMINANCE:
    case PixelFormat.ALPHA:
      return 1;
    default:
      return 1;
  }
}

function isPacked(pixelDatatype: PixelDatatype): boolean {
  return (
    pixelDatatype === PixelDatatype.UNSIGNED_INT_24_8 ||
    pixelDatatype === PixelDatatype.UNSIGNED_SHORT_4_4_4_4 ||
    pixelDatatype === PixelDatatype.UNSIGNED_SHORT_5_5_5_1 ||
    pixelDatatype === PixelDatatype.UNSIGNED_SHORT_5_6_5
  );
}

function sizeInBytes(pixelDatatype: PixelDatatype) : number {
  switch (pixelDatatype) {
    case PixelDatatype.UNSIGNED_BYTE:
      return 1;
    case PixelDatatype.UNSIGNED_SHORT:
    case PixelDatatype.UNSIGNED_SHORT_4_4_4_4:
    case PixelDatatype.UNSIGNED_SHORT_5_5_5_1:
    case PixelDatatype.UNSIGNED_SHORT_5_6_5:
    case PixelDatatype.HALF_FLOAT:
      return 2;
    case PixelDatatype.UNSIGNED_INT:
    case PixelDatatype.UNSIGNED_INT_24_8:
    case PixelDatatype.FLOAT:
      return 4;
  }
}

function textureSizeInBytes(pixelFormat: PixelFormat, pixelDatatype: PixelDatatype, width: number, height: number): number {
  let componentsLength = getComponentsLength(pixelFormat);
  if (isPacked(pixelDatatype)) {
    componentsLength = 1;
  }
  return componentsLength * sizeInBytes(pixelDatatype) * width * height;
}

function alignmentInBytes(pixelFormat: PixelFormat, pixelDatatype: PixelDatatype, width: number): number {
  const mod = textureSizeInBytes(pixelFormat, pixelDatatype, width, 1) % 4;
  return mod === 0 ? 4 : mod === 2 ? 2 : 1;
};

function isDepthFormat(pixelFormat: PixelFormat): boolean {
  return (
    pixelFormat === PixelFormat.DEPTH_COMPONENT ||
    pixelFormat === PixelFormat.DEPTH_STENCIL
  );
}

function isCompressedFormat(pixelFormat: PixelFormat): boolean {
  return false;
  // return (
  //   pixelFormat === PixelFormat.RGB_DXT1 ||
  //   pixelFormat === PixelFormat.RGBA_DXT1 ||
  //   pixelFormat === PixelFormat.RGBA_DXT3 ||
  //   pixelFormat === PixelFormat.RGBA_DXT5 ||
  //   pixelFormat === PixelFormat.RGB_PVRTC_4BPPV1 ||
  //   pixelFormat === PixelFormat.RGB_PVRTC_2BPPV1 ||
  //   pixelFormat === PixelFormat.RGBA_PVRTC_4BPPV1 ||
  //   pixelFormat === PixelFormat.RGBA_PVRTC_2BPPV1 ||
  //   pixelFormat === PixelFormat.RGBA_ASTC ||
  //   pixelFormat === PixelFormat.RGB_ETC1 ||
  //   pixelFormat === PixelFormat.RGB8_ETC2 ||
  //   pixelFormat === PixelFormat.RGBA8_ETC2_EAC ||
  //   pixelFormat === PixelFormat.RGBA_BC7
  // );
}

interface TextureSource {
  arrayBufferView: BufferSource,
  framebuffer: Framebuffer,
}

class Texture {
  _context: Context;
  _textureTarget: number;
  _texture: WebGLTexture;
  _textureFilterAnisotropic: EXT_texture_filter_anisotropic;

  _id: string;
  _internalFormat: number;
  _width: number;
  _height: number;
  _pixelFormat: PixelFormat;
  _pixelDatatype: PixelDatatype;
  _dimensions: Cartesian2;
  _hasMipmap: boolean;
  _sizeInBytes: number;
  _preMultiplyAlpha: boolean;
  _flipY: boolean;
  _initialized: boolean
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
  public get _target() : number {
    return this._textureTarget;
  }

  constructor(options: {
    context: Context,
    width: number,
    height: number,
    source: TextureSource | HTMLVideoElement | HTMLImageElement
    pixelFormat: PixelFormat,
    pixelDatatype: PixelDatatype,
    preMultiplyAlpha: boolean,
    flipY: boolean,
    skipColorSpaceConversion: boolean,
    sampler?: Sampler
  }) {
    const context = options.context;
    let width = options.width;
    let height = options.height;
    const source = options.source;

    if (defined(source)) {
      if (!defined(width)) {
        if (source instanceof HTMLVideoElement) {
          width = source.videoWidth;
        } else if (source instanceof HTMLImageElement) {
          width = source.width;
        }
      }
      if (!defined(height)) {
        if (source instanceof HTMLVideoElement) {
          height = source.videoHeight;
        } else if (source instanceof HTMLImageElement) {
          height = source.height;
        }
      }
    }

    const pixelFormat = defaultValue(options.pixelFormat, PixelFormat.RGBA);
    const pixelDatatype = defaultValue(options.pixelDatatype, PixelDatatype.UNSIGNED_BYTE);
    const internalFormat = toInternalFormat(pixelFormat, pixelDatatype, context);

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
    if (defined(source) && defined((source as any).arrayBufferView) && !isCompressed) {
      unpackAlignment = alignmentInBytes(pixelFormat, pixelDatatype, width);
    }
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);

    if (skipColorSpaceConversion) {
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    } else {
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.BROWSER_DEFAULT_WEBGL);
    }

    if (defined(source)) {
      if (defined((source as any).arrayBufferView)) {
        throw new Error("To be implemented.");
      } else if (defined((source as any).framebuffer)) {
        throw new Error("To be implemented.");
      } else {
        throw new Error("To be implemented.");
      }
    } else {
      gl.texImage2D(
        textureTarget,
        0,
        internalFormat,
        width,
        height,0,
        pixelFormat,
        pixelDatatype,
        null
      );
      initialized = false;
    }
    gl.bindTexture(textureTarget, null);

    let sizeInBytes;
    if (isCompressed) {
      // sizeInBytes = 
      throw new Error("Method not implemented.");
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

  isDestroyed() {
    return false;
  }

  destroy() {
    this._context._gl.deleteTexture(this._texture);
    return destroyObject(this);
  }

}

export default Texture;
