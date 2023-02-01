import defaultValue from "../core/defaultValue";
import defined from "../core/defined";

class Matrix3 {
  0: number;
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
  7: number;
  8: number;

  constructor(
    column0Row0?: number,
    column1Row0?: number,
    column2Row0?: number,
    column0Row1?: number,
    column1Row1?: number,
    column2Row1?: number,
    column0Row2?: number,
    column1Row2?: number,
    column2Row2?: number
  ) {
    this[0] = defaultValue(column0Row0, 0.0) as number;
    this[1] = defaultValue(column0Row1, 0.0) as number;
    this[2] = defaultValue(column0Row2, 0.0) as number;
    this[3] = defaultValue(column1Row0, 0.0) as number;
    this[4] = defaultValue(column1Row1, 0.0) as number;
    this[5] = defaultValue(column1Row2, 0.0) as number;
    this[6] = defaultValue(column2Row0, 0.0) as number;
    this[7] = defaultValue(column2Row1, 0.0) as number;
    this[8] = defaultValue(column2Row2, 0.0) as number;
  }

  static equals(left: Matrix3, right: Matrix3) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left[0] === right[0] &&
        left[1] === right[1] &&
        left[2] === right[2] &&
        left[3] === right[3] &&
        left[4] === right[4] &&
        left[5] === right[5] &&
        left[6] === right[6] &&
        left[7] === right[7] &&
        left[8] === right[8])
    );
  }

  static equalsArray(matrix: Matrix3, array: number[], offset: number) {
    return (
      matrix[0] === array[offset] &&
      matrix[1] === array[offset + 1] &&
      matrix[2] === array[offset + 2] &&
      matrix[3] === array[offset + 3] &&
      matrix[4] === array[offset + 4] &&
      matrix[5] === array[offset + 5] &&
      matrix[6] === array[offset + 6] &&
      matrix[7] === array[offset + 7] &&
      matrix[8] === array[offset + 8]
    );
  }

  static toArray(matrix: Matrix3, result?: number[]) {
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
    return result;
  }

  static clone(matrix: Matrix3, result: Matrix3) {
    if (!defined(matrix)) {
      return undefined;
    }
    if (!defined(result)) {
      return new Matrix3(
        matrix[0],
        matrix[3],
        matrix[6],
        matrix[1],
        matrix[4],
        matrix[7],
        matrix[2],
        matrix[5],
        matrix[8]
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
    return result;
  }
}

export default Matrix3;
