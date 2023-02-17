import defined from "../core/defined";
import destroyObject from "../core/destroyObject";
import BufferUsage from "./BufferUsage";
import Context from "./Context";
import BufferTarget from "./BufferTarget";
import getIndexDatatypeSizeInBytes from "../core/getIndexDatatypeSizeInBytes";

/**
 * @public
 */
class Buffer {
  /** @internal */
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  /** @internal */
  _webgl2: boolean;
  /** @internal */
  _bufferTarget: BufferTarget;
  /** @internal */
  _sizeInBytes: number;
  /** @internal */
  _usage: BufferUsage;
  /** @internal */
  _buffer: WebGLBuffer;

  /**
   * Get the buffer size in bytes unit.
   * @readonly
   */
  get sizeInBytes() {
    return this._sizeInBytes;
  }

  /**
   * Get the buffer usage, see {@link BufferUsage}.
   * @readonly
   */
  get usage() {
    return this._usage;
  }

  /**
   * Index buffer data type, index buffer only.
   * @readonly
   */
  indexDatatype: number | undefined;

  /**
   * Bytes per index, index buffer only.
   * @readonly
   */
  bytesPerIndex: number | undefined;

  /**
   * Number of indices, index buffer only.
   * @readonly
   */
  numberOfIndices: number | undefined;

  /**
   * Whether to destroy this buffer when its vertex array object is destroyed.
   * @defaultValue `true`
   */
  vertexArrayDestroyable: boolean;

  /**
   * @returns Native WebGLBuffer
   * @internal
   */
  _getBuffer() {
    return this._buffer;
  }

  /**
   * To simplify, use {@link Buffer.createVertexBuffer} or {@link Buffer.createIndexBuffer} to create the buffer.
   * @param options -
   * @internal
   * */
  constructor(options: {
    context: Context,
    typedArray: BufferSource,
    sizeInBytes: number,
    usage: BufferUsage,
    bufferTarget: BufferTarget,
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

  /**
   * Create a buffer for vertex attributes.
   * @param options -
   * @returns The Buffer object
   */
  static createVertexBuffer(options: {
    context: Context,
    typedArray?: BufferSource,
    sizeInBytes?: number,
    usage: BufferUsage,
  }): Buffer {
    return new Buffer({
      context: options.context,
      bufferTarget: BufferTarget.ARRAY_BUFFER,
      typedArray: options.typedArray,
      sizeInBytes: options.sizeInBytes,
      usage: options.usage,
    });
  }

  /**
   * Create a buffer for vertex indices.
   * @param options -
   * @returns The Buffer object
   */
  static createIndexBuffer(options: {
    context: Context,
    indexDatatype: number,
    typedArray?: BufferSource,
    sizeInBytes?: number,
    usage: BufferUsage,
  }) : Buffer {
    const indexDatatype = options.indexDatatype;

    const bytesPerIndex = getIndexDatatypeSizeInBytes(indexDatatype);
    const buffer = new Buffer({
      context: options.context,
      bufferTarget: BufferTarget.ELEMENT_ARRAY_BUFFER,
      typedArray: options.typedArray,
      sizeInBytes: options.sizeInBytes,
      usage: options.usage,
    });

    const numberOfIndices = buffer._sizeInBytes / bytesPerIndex;

    Object.defineProperties(buffer, {
      indexDatatype: {
        get() {
          return indexDatatype;
        },
      },
      bytesPerIndex: {
        get() {
          return bytesPerIndex;
        },
      },
      numberOfIndices: {
        get() {
          return numberOfIndices;
        },
      },
    });

    return buffer;
  }

  /**
   * Whether this buffer is destroyed.
   * @returns 
   */
  public isDestroyed() : boolean {
    return false;
  }

  /**
   * Release the WebGL buffer memory.
   * @returns 
   */
  public destroy() {
    this._gl.deleteBuffer(this._buffer);
    return destroyObject(this);
  }
}

export default Buffer;
