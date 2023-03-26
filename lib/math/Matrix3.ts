import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import Cartesian3 from "./Cartesian3";

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

  static COLUMN0ROW0 = 0;
  static COLUMN0ROW1 = 1;
  static COLUMN0ROW2 = 2;
  static COLUMN1ROW0 = 3;
  static COLUMN1ROW1 = 4;
  static COLUMN1ROW2 = 5;
  static COLUMN2ROW0 = 6;
  static COLUMN2ROW1 = 7;
  static COLUMN2ROW2 = 8;

  static ZERO = Object.freeze(new Matrix3(
    0.0, 0.0, 0.0,
    0.0, 0.0, 0.0,
    0.0, 0.0, 0.0
  ));
  static IDENTITY = Object.freeze(new Matrix3(
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
  ));

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

  static unpack(array: ArrayLike<number>, startingIndex = 0, result = new Matrix3()) : Matrix3 {
    result[0] = array[startingIndex++];
    result[1] = array[startingIndex++];
    result[2] = array[startingIndex++];
    result[3] = array[startingIndex++];
    result[4] = array[startingIndex++];
    result[5] = array[startingIndex++];
    result[6] = array[startingIndex++];
    result[7] = array[startingIndex++];
    result[8] = array[startingIndex++];
  return result;
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

  static clone(matrix: Readonly<Matrix3>, result: Matrix3 = new Matrix3()) : Matrix3 {
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

  static fromRotationZ(angle: number, result = new Matrix3()) {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    result[0] = cosAngle;
    result[1] = sinAngle;
    result[2] = 0.0;
    result[3] = -sinAngle;
    result[4] = cosAngle;
    result[5] = 0.0;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = 1.0;

    return result;
  }

  static getElementIndex(column: number, row: number) : number {
    return column * 3 + row;
  }

  static getScale(matrix: Matrix3, result = new Cartesian3()) : Cartesian3 {
    result.x = Cartesian3.magnitude(Cartesian3.fromElements(matrix[0], matrix[1], matrix[2], scratchColumn));
    result.y = Cartesian3.magnitude(Cartesian3.fromElements(matrix[3], matrix[4], matrix[5], scratchColumn));
    result.z = Cartesian3.magnitude(Cartesian3.fromElements(matrix[6], matrix[7], matrix[8], scratchColumn));

    return result;
  }

  static getRotation(matrix: Matrix3, result = new Matrix3()) : Matrix3 {
    const scale = Matrix3.getScale(matrix, scaleScratch5);

    result[0] = matrix[0] / scale.x;
    result[1] = matrix[1] / scale.x;
    result[2] = matrix[2] / scale.x;
    result[3] = matrix[3] / scale.y;
    result[4] = matrix[4] / scale.y;
    result[5] = matrix[5] / scale.y;
    result[6] = matrix[6] / scale.z;
    result[7] = matrix[7] / scale.z;
    result[8] = matrix[8] / scale.z;

    return result;
  }

  static transpose(matrix: Matrix3, result = new Matrix3()) : Matrix3 {
    result[0] = matrix[0];
    result[1] = matrix[3];
    result[2] = matrix[6];
    result[3] = matrix[1];
    result[4] = matrix[4];
    result[5] = matrix[7];
    result[6] = matrix[2];
    result[7] = matrix[5];
    result[8] = matrix[8];

    return result;
  }

  static determinant(matrix: Matrix3) {
    const m11 = matrix[0];
    const m21 = matrix[3];
    const m31 = matrix[6];
    const m12 = matrix[1];
    const m22 = matrix[4];
    const m32 = matrix[7];
    const m13 = matrix[2];
    const m23 = matrix[5];
    const m33 = matrix[8];

    return (
      m11 * (m22 * m33 - m23 * m32) +
      m12 * (m23 * m31 - m21 * m33) +
      m13 * (m21 * m32 - m22 * m31)
    );
  }

  static setColumn(matrix: Matrix3, index: number, cartesian: Cartesian3, result = matrix) : Matrix3 {
    result = Matrix3.clone(matrix, result);
    const startIndex = index * 3;
    result[startIndex] = cartesian.x;
    result[startIndex + 1] = cartesian.y;
    result[startIndex + 2] = cartesian.z;
    return result;
  }
}

const scratchColumn = new Cartesian3();
const scaleScratch5 = new Cartesian3();

export default Matrix3;
