import PixelDatatype from "../core/PixelDatatype";
import PixelFormat from "../core/PixelFormat";
import WebGLConstants from "../core/WebGLConstants";
import Context from "./Context";

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
}

export default CubeMapFace;
