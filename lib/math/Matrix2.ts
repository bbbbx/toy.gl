import defaultValue from "../core/defaultValue";
import defined from "../core/defined";

/**
 * @public
 */
class Matrix2 {
  0: number;
  1: number;
  2: number;
  3: number;

  static ZERO = Object.freeze(new Matrix2(0.0, 0.0, 0.0, 0.0));

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

  static pack(value: Matrix2, array: number[], startingIndex = 0) {
    array[startingIndex + 0] = value[0];
    array[startingIndex + 1] = value[1];
    array[startingIndex + 2] = value[2];
    array[startingIndex + 3] = value[3];

    return array;
  }

  static unpack(value: ArrayLike<number>, startingIndex = 0, result = new Matrix2()) : Matrix2 {
    result[0] = value[startingIndex + 0];
    result[1] = value[startingIndex + 1];
    result[2] = value[startingIndex + 2];
    result[3] = value[startingIndex + 3];
    return result;
  }

  static clone(matrix: Readonly<Matrix2>, result = new Matrix2()) : Matrix2 {
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
