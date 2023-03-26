import Context from "../renderer/Context";
import PixelDatatype from "./PixelDatatype";
import WebGLConstants from "./WebGLConstants";

function pixelDatatypeToWebGLConstant(pixelDatatype: PixelDatatype, context: Context) : WebGLConstants {
  switch (pixelDatatype) {
    case PixelDatatype.UNSIGNED_BYTE:
      return WebGLConstants.UNSIGNED_BYTE;
    case PixelDatatype.UNSIGNED_SHORT:
      return WebGLConstants.UNSIGNED_SHORT;
    case PixelDatatype.UNSIGNED_INT:
      return WebGLConstants.UNSIGNED_INT;
    case PixelDatatype.FLOAT:
      return WebGLConstants.FLOAT;
    case PixelDatatype.HALF_FLOAT:
      return context.webgl2 ? WebGLConstants.FLOAT : WebGLConstants.HALF_FLOAT_OES;
    case PixelDatatype.UNSIGNED_INT_24_8:
      return WebGLConstants.UNSIGNED_INT_24_8;
    case PixelDatatype.UNSIGNED_SHORT_4_4_4_4:
      return WebGLConstants.UNSIGNED_SHORT_4_4_4_4;
    case PixelDatatype.UNSIGNED_SHORT_5_5_5_1:
      return WebGLConstants.UNSIGNED_SHORT_5_5_5_1;
    case PixelDatatype.UNSIGNED_SHORT_5_6_5:
      return WebGLConstants.UNSIGNED_SHORT_5_6_5;
  }
  return pixelDatatype as unknown as WebGLConstants;
}

export default pixelDatatypeToWebGLConstant;
