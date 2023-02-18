import defaultValue from "../core/defaultValue";
import defined from "../core/defined";

/**
 * @public
 */
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
    this[0] = defaultValue(column0Row0, 0.0);
    this[1] = defaultValue(column0Row1, 0.0);
    this[2] = defaultValue(column0Row2, 0.0);
    this[3] = defaultValue(column1Row0, 0.0);
    this[4] = defaultValue(column1Row1, 0.0);
    this[5] = defaultValue(column1Row2, 0.0);
    this[6] = defaultValue(column2Row0, 0.0);
    this[7] = defaultValue(column2Row1, 0.0);
    this[8] = defaultValue(column2Row2, 0.0);
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

  /**
   * Compares the provided matrices componentwise and returns
   * <code>true</code> if they are within the provided epsilon,
   * <code>false</code> otherwise.
   *
   * @param left - The first matrix.
   * @param right - The second matrix.
   * @param epsilon - The epsilon to use for equality testing.
   * @returns <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
   */
  static equalsEpsilon(left: Matrix3, right: Matrix3, epsilon: number = 0.0) : boolean {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        Math.abs(left[0] - right[0]) <= epsilon &&
        Math.abs(left[1] - right[1]) <= epsilon &&
        Math.abs(left[2] - right[2]) <= epsilon &&
        Math.abs(left[3] - right[3]) <= epsilon &&
        Math.abs(left[4] - right[4]) <= epsilon &&
        Math.abs(left[5] - right[5]) <= epsilon &&
        Math.abs(left[6] - right[6]) <= epsilon &&
        Math.abs(left[7] - right[7]) <= epsilon &&
        Math.abs(left[8] - right[8]) <= epsilon)
    );
  };

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

  static pack(value: Matrix3, array: number[], startingIndex = 0) {
    array[startingIndex++] = value[0];
    array[startingIndex++] = value[1];
    array[startingIndex++] = value[2];
    array[startingIndex++] = value[3];
    array[startingIndex++] = value[4];
    array[startingIndex++] = value[5];
    array[startingIndex++] = value[6];
    array[startingIndex++] = value[7];
    array[startingIndex++] = value[8];

    return array;
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
