import PixelDatatype from "../core/PixelDatatype";
import PixelFormat from "../core/PixelFormat";
import WebGLConstants from "../core/WebGLConstants";
import alignmentInBytes from "../core/alignmentInBytes";
import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import flipYForArrayBufferView from "../core/flipYForArrayBufferView";
import pixelDatatypeToWebGLConstant from "../core/pixelDatatypeToWebGLConstant";
import Context from "./Context";
import { TexSource } from "./ITexture";

/**
 * @public
 */
class CubeMapFace {
  _context: Context;
  _texture: WebGLTexture;
  _textureTarget: WebGLConstants;
  _targetFace: WebGLConstants;
  _internalFormat: WebGLConstants;
  _pixelFormat: PixelFormat;
  _pixelDatatype: PixelDatatype;
  _size: number;
  _preMultiplyAlpha: boolean;
  _flipY: boolean;
  _initialized: boolean;

  public get pixelFormat() : PixelFormat {
    return this._pixelFormat;
  }
  public get pixelDatatype() : PixelDatatype {
    return this._pixelDatatype;
  }
  public get _target() : WebGLConstants {
    return this._targetFace;
  }

  constructor(
    context: Context,
    texture: WebGLTexture,
    textureTarget: WebGLConstants,
    targetFace: WebGLConstants,
    internalFormat: WebGLConstants,
    pixelFormat: PixelFormat,
    pixelDatatype: PixelDatatype,
    size: number,
    preMultiplyAlpha: boolean,
    flipY: boolean,
    initialized: boolean
  ) {
    this._context = context;
    this._texture = texture;
    this._textureTarget = textureTarget;
    this._targetFace = targetFace;
    this._internalFormat = internalFormat;
    this._pixelFormat = pixelFormat;
    this._pixelDatatype = pixelDatatype;
    this._size = size;
    this._preMultiplyAlpha = preMultiplyAlpha;
    this._flipY = flipY;
    this._initialized = initialized;
  }

  /**
   * Copies texels from the source to the cubemap's face.
   * @param options -
   * @example
   * Create a cubemap with 2x2 faces, and make the +x face part red.
   * ```js
   * const cubeMap = new CubeMap({
   *   context: context,
   *   flipY: false,
   *   width: 2,
   *   height: 2,
   * });
   * cubeMap.positiveX.copyFrom({
   *   xOffset: 1,
   *   yOffset: 1,
   *   source: {
   *     width: 1,
   *     height: 1,
   *     arrayBufferView: new Uint8Array([ 255, 0, 0, 255 ]),
   *   },
   * });
   * ```
   */
  copyFrom(options: {
    source: {
      width: number,
      height: number,
      arrayBufferView: ArrayBufferView,
    } | TexImageSource,
    xOffset?: number,
    yOffset?: number,
    skipColorSpaceConversion?: boolean,
  }) {
    const xOffset = defaultValue(options.xOffset, 0);
    const yOffset = defaultValue(options.yOffset, 0);

    const source = options.source;

    const gl = this._context._gl;
    const target = this._textureTarget;
    const targetFace = this._targetFace;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(target, this._texture);

    const width = source.width;
    const height = source.height;
    let arrayBufferView = (source as TexSource).arrayBufferView as ArrayBufferView;

    const size = this._size;
    const pixelFormat = this._pixelFormat;
    const pixelDatatype = this._pixelDatatype;
    const internalFormat = this._internalFormat;

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

    if (xOffset === 0 && yOffset === 0 && width === size && height === size) {
      if (defined(arrayBufferView)) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

        if (flipY) {
          arrayBufferView = flipYForArrayBufferView(arrayBufferView, pixelFormat, pixelDatatype, size, size);
        }

        gl.texImage2D(
          targetFace,
          0,
          internalFormat,
          size,
          size,
          0,
          pixelFormat,
          pixelDatatypeToWebGLConstant(pixelDatatype, this._context),
          arrayBufferView
        );
      } else {
        // DOM

        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, preMultiplyAlpha);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

        gl.texImage2D(
          targetFace,
          0,
          internalFormat,
          pixelFormat,
          pixelDatatypeToWebGLConstant(pixelDatatype, this._context),
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
          targetFace,
          0,
          xOffset,
          yOffset,
          width,
          height,
          pixelFormat,
          pixelDatatypeToWebGLConstant(pixelDatatype, this._context),
          arrayBufferView
        );
      } else {
        // DOM
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, preMultiplyAlpha);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);

        gl.texSubImage2D(
          targetFace,
          0,
          xOffset,
          yOffset,
          pixelFormat,
          pixelDatatypeToWebGLConstant(pixelDatatype, this._context),
          source as TexImageSource
        );
      }
    }

    gl.bindTexture(target, null);
  }

  destroy() {}
}

export default CubeMapFace;
