import ComponentDatatype from "../../core/ComponentDatatype";

function getComponentReader(componentType: ComponentDatatype) {
  switch (componentType) {
    case ComponentDatatype.BYTE:
      return function (
        dataView: DataView,
        byteOffset: number,
        numberOfComponents: number,
        componentTypeByteLength: number,
        result: Iterable<number>
      ) {
        for (let i = 0; i < numberOfComponents; ++i) {
          result[i] = dataView.getInt8(
            byteOffset + i * componentTypeByteLength
          );
        }
      };
    case ComponentDatatype.UNSIGNED_BYTE:
      return function (
        dataView: DataView,
        byteOffset: number,
        numberOfComponents: number,
        componentTypeByteLength: number,
        result: Iterable<number>
      ) {
        for (let i = 0; i < numberOfComponents; ++i) {
          result[i] = dataView.getUint8(
            byteOffset + i * componentTypeByteLength
          );
        }
      };
    case ComponentDatatype.SHORT:
      return function (
        dataView: DataView,
        byteOffset: number,
        numberOfComponents: number,
        componentTypeByteLength: number,
        result: Iterable<number>
      ) {
        for (let i = 0; i < numberOfComponents; ++i) {
          result[i] = dataView.getInt16(
            byteOffset + i * componentTypeByteLength,
            true
          );
        }
      };
    case ComponentDatatype.UNSIGNED_SHORT:
      return function (
        dataView: DataView,
        byteOffset: number,
        numberOfComponents: number,
        componentTypeByteLength: number,
        result: Iterable<number>
      ) {
        for (let i = 0; i < numberOfComponents; ++i) {
          result[i] = dataView.getUint16(
            byteOffset + i * componentTypeByteLength,
            true
          );
        }
      };
    case ComponentDatatype.INT:
      return function (
        dataView: DataView,
        byteOffset: number,
        numberOfComponents: number,
        componentTypeByteLength: number,
        result: Iterable<number>
      ) {
        for (let i = 0; i < numberOfComponents; ++i) {
          result[i] = dataView.getInt32(
            byteOffset + i * componentTypeByteLength,
            true
          );
        }
      };
    case ComponentDatatype.UNSIGNED_INT:
      return function (
        dataView: DataView,
        byteOffset: number,
        numberOfComponents: number,
        componentTypeByteLength: number,
        result: Iterable<number>
      ) {
        for (let i = 0; i < numberOfComponents; ++i) {
          result[i] = dataView.getUint32(
            byteOffset + i * componentTypeByteLength,
            true
          );
        }
      };
    case ComponentDatatype.FLOAT:
      return function (
        dataView: DataView,
        byteOffset: number,
        numberOfComponents: number,
        componentTypeByteLength: number,
        result: Iterable<number>
      ) {
        for (let i = 0; i < numberOfComponents; ++i) {
          result[i] = dataView.getFloat32(
            byteOffset + i * componentTypeByteLength,
            true
          );
        }
      };
    case ComponentDatatype.DOUBLE:
      return function (
        dataView: DataView,
        byteOffset: number,
        numberOfComponents: number,
        componentTypeByteLength: number,
        result: Iterable<number>
      ) {
        for (let i = 0; i < numberOfComponents; ++i) {
          result[i] = dataView.getFloat64(
            byteOffset + i * componentTypeByteLength,
            true
          );
        }
      };
  }
}

export default getComponentReader;
