import PixelDatatype from "./PixelDatatype";

function getSizeInBytes(pixelDatatype: PixelDatatype): number {
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

export default getSizeInBytes;
