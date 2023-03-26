import DeveloperError from "./DeveloperError";
import IndexDatatype from "./IndexDatatype";

function getIndexDatatypeSizeInBytes(indexDatatype: IndexDatatype) : number {
  switch (indexDatatype) {
    case IndexDatatype.UNSIGNED_BYTE:
      return Uint8Array.BYTES_PER_ELEMENT;
    case IndexDatatype.UNSIGNED_SHORT:
      return Uint16Array.BYTES_PER_ELEMENT;
    case IndexDatatype.UNSIGNED_INT:
      return Uint32Array.BYTES_PER_ELEMENT;
  }
  throw new DeveloperError('indexDatatype is required and must be a valid IndexDatatype constant.');
}

export default getIndexDatatypeSizeInBytes;
