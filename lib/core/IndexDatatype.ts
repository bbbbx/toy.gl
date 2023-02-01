import WebGLConstant from "./WebGLConstant";

const SIXTY_FOUR_KILOBYTES = 64 * 1024;

class IndexDatatype {
  static UNSIGNED_BYTE = WebGLConstant.UNSIGNED_BYTE;
  static UNSIGNED_SHORT = WebGLConstant.UNSIGNED_SHORT;
  static UNSIGNED_INT = WebGLConstant.UNSIGNED_INT;

  static getSizeInBytes(indexDatatype: number) : number {
    switch (indexDatatype) {
      case IndexDatatype.UNSIGNED_BYTE:
        return Uint8Array.BYTES_PER_ELEMENT;
      case IndexDatatype.UNSIGNED_SHORT:
        return Uint16Array.BYTES_PER_ELEMENT;
      case IndexDatatype.UNSIGNED_INT:
        return Uint32Array.BYTES_PER_ELEMENT;
    }
  }

  static createTypedArray(
    numberOfVertices: number,
    indicesLengthOrArray: number | (ArrayLike<number> | ArrayBufferLike)
  ) : Uint32Array | Uint16Array {
    if (numberOfVertices >= SIXTY_FOUR_KILOBYTES) {
      if (typeof indicesLengthOrArray === 'number') {
        return new Uint32Array(indicesLengthOrArray);
      } else {
        return new Uint32Array(indicesLengthOrArray);
      }
    }

    if (typeof indicesLengthOrArray === 'number') {
      return new Uint16Array(indicesLengthOrArray);
    } else {
      return new Uint16Array(indicesLengthOrArray);
    }
  }

  static createTypedArrayFromArrayBuffer(
    numberOfVertices: number,
    sourceArray: ArrayBufferLike,
    byteOffset: number,
    length: number
  ) : Uint32Array | Uint16Array {
    if (numberOfVertices >= SIXTY_FOUR_KILOBYTES) {
      return new Uint32Array(sourceArray, byteOffset, length);
    }

    return new Uint16Array(sourceArray, byteOffset, length);
  }
}

export default IndexDatatype;
