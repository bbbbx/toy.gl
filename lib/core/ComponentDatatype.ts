import WebGLConstant from "./WebGLConstant";
import defined from "./defined";

/**
 * @public
 */
class ComponentDatatype {
  static BYTE = WebGLConstant.BYTE;
  static UNSIGNED_BYTE = WebGLConstant.UNSIGNED_BYTE;
  static SHORT = WebGLConstant.SHORT;
  static UNSIGNED_SHORT = WebGLConstant.UNSIGNED_SHORT;
  static INT = WebGLConstant.INT;
  static UNSIGNED_INT = WebGLConstant.UNSIGNED_INT;
  static FLOAT = WebGLConstant.FLOAT;
  static DOUBLE = WebGLConstant.DOUBLE;

  static validate(componentDatatype) {
    return (
      defined(componentDatatype) &&
      (componentDatatype === ComponentDatatype.BYTE ||
        componentDatatype === ComponentDatatype.UNSIGNED_BYTE ||
        componentDatatype === ComponentDatatype.SHORT ||
        componentDatatype === ComponentDatatype.UNSIGNED_SHORT ||
        componentDatatype === ComponentDatatype.INT ||
        componentDatatype === ComponentDatatype.UNSIGNED_INT ||
        componentDatatype === ComponentDatatype.FLOAT ||
        componentDatatype === ComponentDatatype.DOUBLE)
    );
  };

  static getSizeInBytes(componentDatatype) {
    switch (componentDatatype) {
      case ComponentDatatype.BYTE:
        return Int8Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.UNSIGNED_BYTE:
        return Uint8Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.SHORT:
        return Int16Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.UNSIGNED_SHORT:
        return Uint16Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.INT:
        return Int32Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.UNSIGNED_INT:
        return Uint32Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.FLOAT:
        return Float32Array.BYTES_PER_ELEMENT;
      case ComponentDatatype.DOUBLE:
        return Float64Array.BYTES_PER_ELEMENT;
    }
  }
}

export default ComponentDatatype;
