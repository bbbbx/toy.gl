import defaultValue from "../core/defaultValue";
import defined from "../core/defined";

class Matrix4 {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;
  9: number;
  10: number;
  11: number;
  12: number;
  13: number;
  14: number;
  15: number;

  constructor(
    column0Row0?: number,
    column1Row0?: number,
    column2Row0?: number,
    column3Row0?: number,
    column0Row1?: number,
    column1Row1?: number,
    column2Row1?: number,
    column3Row1?: number,
    column0Row2?: number,
    column1Row2?: number,
    column2Row2?: number,
    column3Row2?: number,
    column0Row3?: number,
    column1Row3?: number,
    column2Row3?: number,
    column3Row3?: number
  ) {
    this[0] = defaultValue(column0Row0, 0.0) as number;
    this[1] = defaultValue(column0Row1, 0.0) as number;
    this[2] = defaultValue(column0Row2, 0.0) as number;
    this[3] = defaultValue(column0Row3, 0.0) as number;
    this[4] = defaultValue(column1Row0, 0.0) as number;
    this[5] = defaultValue(column1Row1, 0.0) as number;
    this[6] = defaultValue(column1Row2, 0.0) as number;
    this[7] = defaultValue(column1Row3, 0.0) as number;
    this[8] = defaultValue(column2Row0, 0.0) as number;
    this[9] = defaultValue(column2Row1, 0.0) as number;
    this[10] = defaultValue(column2Row2, 0.0) as number;
    this[11] = defaultValue(column2Row3, 0.0) as number;
    this[12] = defaultValue(column3Row0, 0.0) as number;
    this[13] = defaultValue(column3Row1, 0.0) as number;
    this[14] = defaultValue(column3Row2, 0.0) as number;
    this[15] = defaultValue(column3Row3, 0.0) as number;
  }

  static equals(left: Matrix4, right: Matrix4) {
    // Given that most matrices will be transformation matrices, the elements
    // are tested in order such that the test is likely to fail as early
    // as possible.  I _think_ this is just as friendly to the L1 cache
    // as testing in index order.  It is certainty faster in practice.
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        // Translation
        left[12] === right[12] &&
        left[13] === right[13] &&
        left[14] === right[14] &&
        // Rotation/scale
        left[0] === right[0] &&
        left[1] === right[1] &&
        left[2] === right[2] &&
        left[4] === right[4] &&
        left[5] === right[5] &&
        left[6] === right[6] &&
        left[8] === right[8] &&
        left[9] === right[9] &&
        left[10] === right[10] &&
        // Bottom row
        left[3] === right[3] &&
        left[7] === right[7] &&
        left[11] === right[11] &&
        left[15] === right[15])
    );
  }

  static equalsArray(matrix: Matrix4, array: number[], offset: number) {
    return (
      matrix[0] === array[offset] &&
      matrix[1] === array[offset + 1] &&
      matrix[2] === array[offset + 2] &&
      matrix[3] === array[offset + 3] &&
      matrix[4] === array[offset + 4] &&
      matrix[5] === array[offset + 5] &&
      matrix[6] === array[offset + 6] &&
      matrix[7] === array[offset + 7] &&
      matrix[8] === array[offset + 8] &&
      matrix[9] === array[offset + 9] &&
      matrix[10] === array[offset + 10] &&
      matrix[11] === array[offset + 11] &&
      matrix[12] === array[offset + 12] &&
      matrix[13] === array[offset + 13] &&
      matrix[14] === array[offset + 14] &&
      matrix[15] === array[offset + 15]
    );
  }

  static toArray(matrix: Matrix4, result?: number[]) {
    if (!defined(result)) {
      return [
        matrix[0],
        matrix[1],
        matrix[2],
        matrix[3],
        matrix[4],
        matrix[5],
        matrix[6],
        matrix[7],
        matrix[8],
        matrix[9],
        matrix[10],
        matrix[11],
        matrix[12],
        matrix[13],
        matrix[14],
        matrix[15],
      ];
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];
    result[8] = matrix[8];
    result[9] = matrix[9];
    result[10] = matrix[10];
    result[11] = matrix[11];
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }

  static clone(matrix: Matrix4, result: Matrix4) {
    if (!defined(matrix)) {
      return undefined;
    }
    if (!defined(result)) {
      return new Matrix4(
        matrix[0],
        matrix[4],
        matrix[8],
        matrix[12],
        matrix[1],
        matrix[5],
        matrix[9],
        matrix[13],
        matrix[2],
        matrix[6],
        matrix[10],
        matrix[14],
        matrix[3],
        matrix[7],
        matrix[11],
        matrix[15]
      );
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    result[4] = matrix[4];
    result[5] = matrix[5];
    result[6] = matrix[6];
    result[7] = matrix[7];
    result[8] = matrix[8];
    result[9] = matrix[9];
    result[10] = matrix[10];
    result[11] = matrix[11];
    result[12] = matrix[12];
    result[13] = matrix[13];
    result[14] = matrix[14];
    result[15] = matrix[15];
    return result;
  }
}

export default Matrix4;
