import defaultValue from "../core/defaultValue";
import defined from "../core/defined";

class Matrix2 {
  0: number;
  1: number;
  2: number;
  3: number;

  constructor(
    column0Row0?: number,
    column1Row0?: number,
    column0Row1?: number,
    column1Row1?: number
  ) {
    this[0] = defaultValue(column0Row0, 0.0);
    this[1] = defaultValue(column0Row1, 0.0);
    this[2] = defaultValue(column1Row0, 0.0);
    this[3] = defaultValue(column1Row1, 0.0);
  }

  static equals(left: Matrix2, right: Matrix2) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left[0] === right[0] &&
        left[1] === right[1] &&
        left[2] === right[2] &&
        left[3] === right[3])
    );
  }

  static equalsArray(matrix: Matrix2, array: number[], offset: number) {
    return (
      matrix[0] === array[offset] &&
      matrix[1] === array[offset + 1] &&
      matrix[2] === array[offset + 2] &&
      matrix[3] === array[offset + 3]
    );
  }

  static clone(matrix: Matrix2, result?: Matrix2) {
    if (!defined(matrix)) {
      return undefined;
    }
    if (!defined(result)) {
      return new Matrix2(matrix[0], matrix[2], matrix[1], matrix[3]);
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    return result;
  }

  static toArray(matrix: Matrix2, result?: number[]) {
    if (!defined(result)) {
      return [matrix[0], matrix[1], matrix[2], matrix[3]];
    }
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[3];
    return result;
  }
}

export default Matrix2;
