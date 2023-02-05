import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import Cartesian3 from "./Cartesian3";
import Cartesian4 from "./Cartesian4";
import Matrix3 from "./Matrix3";
import MyMath from "./MyMath";

const scratchInverseRotation = new Matrix3();
const scratchMatrix3Zero = new Matrix3();
const scratchBottomRow = new Cartesian4();
const scratchExpectedBottomRow = new Cartesian4(0.0, 0.0, 0.0, 1.0);


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



  /**
   * An immutable Matrix4 instance initialized to the identity matrix.
   *
   * @type {Matrix4}
   * @constant
   */
  static IDENTITY = Object.freeze(
    new Matrix4(
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0
    )
  );

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

  /**
   * Computes a Matrix4 instance that transforms from world space to view space.
   *
   * @param {Cartesian3} position The position of the camera.
   * @param {Cartesian3} direction The forward direction.
   * @param {Cartesian3} up The up direction.
   * @param {Cartesian3} [right] The right direction.
   * @param {Matrix4} [result] The object in which the result will be stored.
   * @returns {Matrix4} The modified result parameter.
   */
  static computeView(position: Cartesian3, direction: Cartesian3, up: Cartesian3, right: Cartesian3, result: Matrix4 = new Matrix4()) {
    if (!defined(right)) {
      right = Cartesian3.cross(direction, up);
    }
    result[0] = right.x;
    result[1] = up.x;
    result[2] = -direction.x;
    result[3] = 0.0;
    result[4] = right.y;
    result[5] = up.y;
    result[6] = -direction.y;
    result[7] = 0.0;
    result[8] = right.z;
    result[9] = up.z;
    result[10] = -direction.z;
    result[11] = 0.0;
    result[12] = -Cartesian3.dot(right, position);
    result[13] = -Cartesian3.dot(up, position);
    result[14] = Cartesian3.dot(direction, position);
    result[15] = 1.0;
    return result;
  }

  /**
   * Computes a Matrix4 instance representing a perspective transformation matrix.
   *
   * @param {Number} fovY The field of view along the Y axis in radians.
   * @param {Number} aspectRatio The aspect ratio.
   * @param {Number} near The distance to the near plane in meters.
   * @param {Number} far The distance to the far plane in meters.
   * @param {Matrix4} [result] The object in which the result will be stored.
   * @returns {Matrix4} The modified result parameter.
   *
   * @exception {DeveloperError} fovY must be in (0, PI].
   * @exception {DeveloperError} aspectRatio must be greater than zero.
   * @exception {DeveloperError} near must be greater than zero.
   * @exception {DeveloperError} far must be greater than zero.
   */
  static computePerspectiveFieldOfView(
    fovY: number,
    aspectRatio: number,
    near: number,
    far: number,
    result: Matrix4 = new Matrix4()
  ) {
    const bottom = Math.tan(fovY * 0.5);

    const column1Row1 = 1.0 / bottom;
    const column0Row0 = column1Row1 / aspectRatio;
    const column2Row2 = (far + near) / (near - far);
    const column3Row2 = (2.0 * far * near) / (near - far);

    result[0] = column0Row0;
    result[1] = 0.0;
    result[2] = 0.0;
    result[3] = 0.0;
    result[4] = 0.0;
    result[5] = column1Row1;
    result[6] = 0.0;
    result[7] = 0.0;
    result[8] = 0.0;
    result[9] = 0.0;
    result[10] = column2Row2;
    result[11] = -1.0;
    result[12] = 0.0;
    result[13] = 0.0;
    result[14] = column3Row2;
    result[15] = 0.0;
    return result;
  }

  /**
   * Computes the product of a matrix and a {@link Cartesian3}. This is equivalent to calling {@link Matrix4.multiplyByVector}
   * with a {@link Cartesian4} with a <code>w</code> component of 1, but returns a {@link Cartesian3} instead of a {@link Cartesian4}.
   *
   * @param {Matrix4} matrix The matrix.
   * @param {Cartesian3} cartesian The point.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static multiplyByPoint(matrix: Matrix4, cartesian: Cartesian3, result: Cartesian3 = new Cartesian3()): Cartesian3 {
    const vX = cartesian.x;
    const vY = cartesian.y;
    const vZ = cartesian.z;

    const x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ + matrix[12];
    const y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ + matrix[13];
    const z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ + matrix[14];

    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }

  /**
   * Computes the product of a matrix and a column vector.
   *
   * @param {Matrix4} matrix The matrix.
   * @param {Cartesian4} cartesian The vector.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   */
  static multiplyByVector(matrix: Matrix4, cartesian: Cartesian4, result: Cartesian4 = new Cartesian4()): Cartesian4 {
    const vX = cartesian.x;
    const vY = cartesian.y;
    const vZ = cartesian.z;
    const vW = cartesian.w;

    const x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ + matrix[12] * vW;
    const y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ + matrix[13] * vW;
    const z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ + matrix[14] * vW;
    const w = matrix[3] * vX + matrix[7] * vY + matrix[11] * vZ + matrix[15] * vW;

    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  }

  /**
   * Computes the product of two matrices.
   *
   * @param {Matrix4} left The first matrix.
   * @param {Matrix4} right The second matrix.
   * @param {Matrix4} [result] The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   */
  static multiply(left: Matrix4, right: Matrix4, result: Matrix4 = new Matrix4()): Matrix4 {
    const left0 = left[0];
    const left1 = left[1];
    const left2 = left[2];
    const left3 = left[3];
    const left4 = left[4];
    const left5 = left[5];
    const left6 = left[6];
    const left7 = left[7];
    const left8 = left[8];
    const left9 = left[9];
    const left10 = left[10];
    const left11 = left[11];
    const left12 = left[12];
    const left13 = left[13];
    const left14 = left[14];
    const left15 = left[15];

    const right0 = right[0];
    const right1 = right[1];
    const right2 = right[2];
    const right3 = right[3];
    const right4 = right[4];
    const right5 = right[5];
    const right6 = right[6];
    const right7 = right[7];
    const right8 = right[8];
    const right9 = right[9];
    const right10 = right[10];
    const right11 = right[11];
    const right12 = right[12];
    const right13 = right[13];
    const right14 = right[14];
    const right15 = right[15];

    const column0Row0 =
      left0 * right0 + left4 * right1 + left8 * right2 + left12 * right3;
    const column0Row1 =
      left1 * right0 + left5 * right1 + left9 * right2 + left13 * right3;
    const column0Row2 =
      left2 * right0 + left6 * right1 + left10 * right2 + left14 * right3;
    const column0Row3 =
      left3 * right0 + left7 * right1 + left11 * right2 + left15 * right3;

    const column1Row0 =
      left0 * right4 + left4 * right5 + left8 * right6 + left12 * right7;
    const column1Row1 =
      left1 * right4 + left5 * right5 + left9 * right6 + left13 * right7;
    const column1Row2 =
      left2 * right4 + left6 * right5 + left10 * right6 + left14 * right7;
    const column1Row3 =
      left3 * right4 + left7 * right5 + left11 * right6 + left15 * right7;

    const column2Row0 =
      left0 * right8 + left4 * right9 + left8 * right10 + left12 * right11;
    const column2Row1 =
      left1 * right8 + left5 * right9 + left9 * right10 + left13 * right11;
    const column2Row2 =
      left2 * right8 + left6 * right9 + left10 * right10 + left14 * right11;
    const column2Row3 =
      left3 * right8 + left7 * right9 + left11 * right10 + left15 * right11;

    const column3Row0 =
      left0 * right12 + left4 * right13 + left8 * right14 + left12 * right15;
    const column3Row1 =
      left1 * right12 + left5 * right13 + left9 * right14 + left13 * right15;
    const column3Row2 =
      left2 * right12 + left6 * right13 + left10 * right14 + left14 * right15;
    const column3Row3 =
      left3 * right12 + left7 * right13 + left11 * right14 + left15 * right15;

    result[0] = column0Row0;
    result[1] = column0Row1;
    result[2] = column0Row2;
    result[3] = column0Row3;
    result[4] = column1Row0;
    result[5] = column1Row1;
    result[6] = column1Row2;
    result[7] = column1Row3;
    result[8] = column2Row0;
    result[9] = column2Row1;
    result[10] = column2Row2;
    result[11] = column2Row3;
    result[12] = column3Row0;
    result[13] = column3Row1;
    result[14] = column3Row2;
    result[15] = column3Row3;
    return result;
  }

  /**
   * Computes the inverse of the provided matrix using Cramers Rule.
   * If the determinant is zero, the matrix can not be inverted, and an exception is thrown.
   *
   * @param {Matrix4} matrix The matrix to invert.
   * @param {Matrix4} result The object onto which to store the result.
   * @returns {Matrix4} The modified result parameter.
   *
   * @exception {Error} matrix is not invertible because its determinate is zero.
   */
  static inverse(matrix: Matrix4, result: Matrix4 = new Matrix4()) {
    //
    // Ported from:
    //   ftp://download.intel.com/design/PentiumIII/sml/24504301.pdf
    //
    const src0 = matrix[0];
    const src1 = matrix[4];
    const src2 = matrix[8];
    const src3 = matrix[12];
    const src4 = matrix[1];
    const src5 = matrix[5];
    const src6 = matrix[9];
    const src7 = matrix[13];
    const src8 = matrix[2];
    const src9 = matrix[6];
    const src10 = matrix[10];
    const src11 = matrix[14];
    const src12 = matrix[3];
    const src13 = matrix[7];
    const src14 = matrix[11];
    const src15 = matrix[15];

    // calculate pairs for first 8 elements (cofactors)
    let tmp0 = src10 * src15;
    let tmp1 = src11 * src14;
    let tmp2 = src9 * src15;
    let tmp3 = src11 * src13;
    let tmp4 = src9 * src14;
    let tmp5 = src10 * src13;
    let tmp6 = src8 * src15;
    let tmp7 = src11 * src12;
    let tmp8 = src8 * src14;
    let tmp9 = src10 * src12;
    let tmp10 = src8 * src13;
    let tmp11 = src9 * src12;

    // calculate first 8 elements (cofactors)
    const dst0 =
      tmp0 * src5 +
      tmp3 * src6 +
      tmp4 * src7 -
      (tmp1 * src5 + tmp2 * src6 + tmp5 * src7);
    const dst1 =
      tmp1 * src4 +
      tmp6 * src6 +
      tmp9 * src7 -
      (tmp0 * src4 + tmp7 * src6 + tmp8 * src7);
    const dst2 =
      tmp2 * src4 +
      tmp7 * src5 +
      tmp10 * src7 -
      (tmp3 * src4 + tmp6 * src5 + tmp11 * src7);
    const dst3 =
      tmp5 * src4 +
      tmp8 * src5 +
      tmp11 * src6 -
      (tmp4 * src4 + tmp9 * src5 + tmp10 * src6);
    const dst4 =
      tmp1 * src1 +
      tmp2 * src2 +
      tmp5 * src3 -
      (tmp0 * src1 + tmp3 * src2 + tmp4 * src3);
    const dst5 =
      tmp0 * src0 +
      tmp7 * src2 +
      tmp8 * src3 -
      (tmp1 * src0 + tmp6 * src2 + tmp9 * src3);
    const dst6 =
      tmp3 * src0 +
      tmp6 * src1 +
      tmp11 * src3 -
      (tmp2 * src0 + tmp7 * src1 + tmp10 * src3);
    const dst7 =
      tmp4 * src0 +
      tmp9 * src1 +
      tmp10 * src2 -
      (tmp5 * src0 + tmp8 * src1 + tmp11 * src2);

    // calculate pairs for second 8 elements (cofactors)
    tmp0 = src2 * src7;
    tmp1 = src3 * src6;
    tmp2 = src1 * src7;
    tmp3 = src3 * src5;
    tmp4 = src1 * src6;
    tmp5 = src2 * src5;
    tmp6 = src0 * src7;
    tmp7 = src3 * src4;
    tmp8 = src0 * src6;
    tmp9 = src2 * src4;
    tmp10 = src0 * src5;
    tmp11 = src1 * src4;

    // calculate second 8 elements (cofactors)
    const dst8 =
      tmp0 * src13 +
      tmp3 * src14 +
      tmp4 * src15 -
      (tmp1 * src13 + tmp2 * src14 + tmp5 * src15);
    const dst9 =
      tmp1 * src12 +
      tmp6 * src14 +
      tmp9 * src15 -
      (tmp0 * src12 + tmp7 * src14 + tmp8 * src15);
    const dst10 =
      tmp2 * src12 +
      tmp7 * src13 +
      tmp10 * src15 -
      (tmp3 * src12 + tmp6 * src13 + tmp11 * src15);
    const dst11 =
      tmp5 * src12 +
      tmp8 * src13 +
      tmp11 * src14 -
      (tmp4 * src12 + tmp9 * src13 + tmp10 * src14);
    const dst12 =
      tmp2 * src10 +
      tmp5 * src11 +
      tmp1 * src9 -
      (tmp4 * src11 + tmp0 * src9 + tmp3 * src10);
    const dst13 =
      tmp8 * src11 +
      tmp0 * src8 +
      tmp7 * src10 -
      (tmp6 * src10 + tmp9 * src11 + tmp1 * src8);
    const dst14 =
      tmp6 * src9 +
      tmp11 * src11 +
      tmp3 * src8 -
      (tmp10 * src11 + tmp2 * src8 + tmp7 * src9);
    const dst15 =
      tmp10 * src10 +
      tmp4 * src8 +
      tmp9 * src9 -
      (tmp8 * src9 + tmp11 * src10 + tmp5 * src8);

    // calculate determinant
    let det = src0 * dst0 + src1 * dst1 + src2 * dst2 + src3 * dst3;

    if (Math.abs(det) < MyMath.EPSILON21) {
      // Special case for a zero scale matrix that can occur, for example,
      // when a model's node has a [0, 0, 0] scale.
      if (
        Matrix3.equalsEpsilon(
          Matrix4.getMatrix3(matrix, scratchInverseRotation),
          scratchMatrix3Zero,
          MyMath.EPSILON7
        ) &&
        Cartesian4.equals(
          Matrix4.getRow(matrix, 3, scratchBottomRow),
          scratchExpectedBottomRow
        )
      ) {
        result[0] = 0.0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = 0.0;
        result[11] = 0.0;
        result[12] = -matrix[12];
        result[13] = -matrix[13];
        result[14] = -matrix[14];
        result[15] = 1.0;
        return result;
      }

      throw new Error(
        'matrix is not invertible because its determinate is zero.'
      );
    }

    // calculate matrix inverse
    det = 1.0 / det;

    result[0] = dst0 * det;
    result[1] = dst1 * det;
    result[2] = dst2 * det;
    result[3] = dst3 * det;
    result[4] = dst4 * det;
    result[5] = dst5 * det;
    result[6] = dst6 * det;
    result[7] = dst7 * det;
    result[8] = dst8 * det;
    result[9] = dst9 * det;
    result[10] = dst10 * det;
    result[11] = dst11 * det;
    result[12] = dst12 * det;
    result[13] = dst13 * det;
    result[14] = dst14 * det;
    result[15] = dst15 * det;
    return result;
  };

  /**
   * Gets the upper left 3x3 matrix of the provided matrix.
   *
   * @param {Matrix4} matrix The matrix to use.
   * @param {Matrix3} result The object onto which to store the result.
   * @returns {Matrix3} The modified result parameter.
   */
  static getMatrix3(matrix: Matrix4, result: Matrix3 = new Matrix3()) {
    result[0] = matrix[0];
    result[1] = matrix[1];
    result[2] = matrix[2];
    result[3] = matrix[4];
    result[4] = matrix[5];
    result[5] = matrix[6];
    result[6] = matrix[8];
    result[7] = matrix[9];
    result[8] = matrix[10];
    return result;
  }

  /**
   * Retrieves a copy of the matrix row at the provided index as a Cartesian4 instance.
   *
   * @param {Matrix4} matrix The matrix to use.
   * @param {Number} index The zero-based index of the row to retrieve.
   * @param {Cartesian4} result The object onto which to store the result.
   * @returns {Cartesian4} The modified result parameter.
   *
   * @exception {DeveloperError} index must be 0, 1, 2, or 3.
   */
  static getRow(matrix: Matrix4, index: number, result: Cartesian4 = new Cartesian4()) {
    const x = matrix[index];
    const y = matrix[index + 4];
    const z = matrix[index + 8];
    const w = matrix[index + 12];

    result.x = x;
    result.y = y;
    result.z = z;
    result.w = w;
    return result;
  };

}

export default Matrix4;
