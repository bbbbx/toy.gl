import WebGLConstant from "../core/WebGLConstant";
import defined from "../core/defined";
import destroyObject from "../core/destroyObject";
import BufferUsage from "./BufferUsage";
import Context from "./Context";
import IndexDatatype from "../core/IndexDatatype";

type BufferTarget = WebGLConstant.ELEMENT_ARRAY_BUFFER | WebGLConstant.ARRAY_BUFFER;

class Buffer {
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _webgl2: boolean;
  _bufferTarget: BufferTarget;
  _sizeInBytes: number;
  _usage: BufferUsage;
  _buffer: WebGLBuffer;
  vertexArrayDestroyable: boolean;

  indexDatatype: number;
  bytesPerIndex: number;
  numberOfIndices: number;

  constructor(options: {
    context: Context,
    typedArray?: BufferSource,
    sizeInBytes?: number,
    usage?: BufferUsage,
    bufferTarget?: BufferTarget,
  }) {
    const gl = options.context._gl;
    const bufferTarget = options.bufferTarget;
    const typedArray = options.typedArray;
    let sizeInBytes = options.sizeInBytes;
    const usage = options.usage;
    const hasArray = defined(typedArray);

    if (hasArray) {
      sizeInBytes = typedArray.byteLength;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(bufferTarget, buffer);
    // gl.bufferData(bufferTarget, hasArray ? typedArray : sizeInBytes, usage);
    if (hasArray) {
      gl.bufferData(bufferTarget, typedArray, usage);
    } else {
      gl.bufferData(bufferTarget, sizeInBytes, usage);
    }
    gl.bindBuffer(bufferTarget, null);

    this._gl = gl;
    this._webgl2 = options.context._webgl2
    this._bufferTarget = bufferTarget;
    this._sizeInBytes = sizeInBytes;
    this._usage = usage;
    this._buffer = buffer;
    this.vertexArrayDestroyable = true;
  }

  static createVertexBuffer(options: {
    context: Context,
    typedArray?: BufferSource,
    sizeInBytes?: number,
    usage: BufferUsage,
    bufferTarget?: BufferTarget,
  }): Buffer {
    return new Buffer({
      context: options.context,
      bufferTarget: WebGLConstant.ARRAY_BUFFER,
      typedArray: options.typedArray,
      sizeInBytes: options.sizeInBytes,
      usage: options.usage,
    });
  }

  static createIndexBuffer(options: {
    context: Context,
    indexDatatype: number,
    typedArray?: BufferSource,
    sizeInBytes?: number,
    usage: BufferUsage,
    bufferTarget?: BufferTarget,
  }) : Buffer {
    const context = options.context;
    const indexDatatype = options.indexDatatype;

    const bytesPerIndex = IndexDatatype.getSizeInBytes(indexDatatype);
    const buffer = new Buffer({
      context: options.context,
      bufferTarget: WebGLConstant.ELEMENT_ARRAY_BUFFER,
      typedArray: options.typedArray,
      sizeInBytes: options.sizeInBytes,
      usage: options.usage,
    });

    const numberOfIndices = buffer._sizeInBytes / bytesPerIndex;

    Object.defineProperties(buffer, {
      indexDatatype: {
        get: function() {
          return indexDatatype;
        },
      },
      bytesPerIndex: {
        get: function() {
          return indexDatatype;
        },
      },
      numberOfIndices: {
        get: function() {
          return numberOfIndices;
        },
      },
    });

    return buffer;
  }

  get sizeInBytes() {
    return this._sizeInBytes;
  }

  get usage() {
    return this.usage;
  }

  _getBuffer() {
    return this._buffer;
  }

  public isDestroyed() {
    return false;
  }

  public destroy() {
    this._gl.deleteBuffer(this._buffer);
    return destroyObject(this);
  }
}

export default Buffer;
