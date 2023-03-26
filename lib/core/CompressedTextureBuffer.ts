import PixelDatatype from "./PixelDatatype";
import PixelFormat from "./PixelFormat";
import defined from "./defined";

class CompressedTextureBuffer {
  _format: PixelFormat;
  _datatype: PixelDatatype;
  _width: number;
  _height: number;
  _buffer: Uint8Array;

  public get internalFormat() { return this._format; }
  public get pixelDatatype() { return this._datatype; }
  public get width() { return this._width; }
  public get height() { return this._height; }
  public get bufferView() { return this._buffer; }

  constructor(
    internalFormat: PixelFormat,
    pixelDatatype: PixelDatatype,
    width: number,
    height: number,
    buffer: Uint8Array
  ) {
    this._format = internalFormat;
    this._datatype = pixelDatatype;
    this._width = width;
    this._height = height;
    this._buffer = buffer;
  }

  clone() {
    return CompressedTextureBuffer.clone(this);
  }

  static clone(object?: CompressedTextureBuffer) {
    if (!defined(object)) {
      return undefined;
    }

    return new CompressedTextureBuffer(
      object._format,
      object._datatype,
      object.width,
      object._height,
      object._buffer
    );
  }

}

export default CompressedTextureBuffer;
