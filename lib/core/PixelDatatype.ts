import WebGLConstant from "./WebGLConstant";

/**
 * @public
 */
enum PixelDatatype {
  UNSIGNED_BYTE = WebGLConstant.UNSIGNED_BYTE,
  UNSIGNED_SHORT = WebGLConstant.UNSIGNED_SHORT,
  UNSIGNED_INT = WebGLConstant.UNSIGNED_INT,
  HALF_FLOAT = WebGLConstant.HALF_FLOAT_OES,
  FLOAT = WebGLConstant.FLOAT,
  UNSIGNED_INT_24_8 = WebGLConstant.UNSIGNED_INT_24_8,
  UNSIGNED_SHORT_4_4_4_4 = WebGLConstant.UNSIGNED_SHORT_4_4_4_4,
  UNSIGNED_SHORT_5_5_5_1 = WebGLConstant.UNSIGNED_SHORT_5_5_5_1,
  UNSIGNED_SHORT_5_6_5 = WebGLConstant.UNSIGNED_SHORT_5_6_5,
}

export default PixelDatatype;
