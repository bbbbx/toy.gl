import defaultValue from '../defaultValue.js';
import defined from '../defined.js';
import Cartesian3 from './Cartesian3.js';
import MMath from './Math.js';

/**
 * A 3x3 matrix, indexable as a column-major order array.
 * Constructor parameters are in row-major order for code readability.
 * @alias Matrix3
 * @constructor
 *
 * @param {Number} [column0Row0=0.0] The value for column 0, row 0.
 * @param {Number} [column1Row0=0.0] The value for column 1, row 0.
 * @param {Number} [column2Row0=0.0] The value for column 2, row 0.
 * @param {Number} [column0Row1=0.0] The value for column 0, row 1.
 * @param {Number} [column1Row1=0.0] The value for column 1, row 1.
 * @param {Number} [column2Row1=0.0] The value for column 2, row 1.
 * @param {Number} [column0Row2=0.0] The value for column 0, row 2.
 * @param {Number} [column1Row2=0.0] The value for column 1, row 2.
 * @param {Number} [column2Row2=0.0] The value for column 2, row 2.
 *
 * @see Matrix3.fromColumnMajorArray
 * @see Matrix3.fromRowMajorArray
 * @see Matrix3.fromQuaternion
 * @see Matrix3.fromHeadingPitchRoll
 * @see Matrix3.fromScale
 * @see Matrix3.fromUniformScale
 * @see Matrix3.fromCrossProduct
 * @see Matrix3.fromRotationX
 * @see Matrix3.fromRotationY
 * @see Matrix3.fromRotationZ
 */
function Matrix3(
  column0Row0,
  column1Row0,
  column2Row0,
  column0Row1,
  column1Row1,
  column2Row1,
  column0Row2,
  column1Row2,
  column2Row2
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

Object.defineProperties(Matrix3.prototype, {
  length: {
    get: function() {
      return 9;
    },
  },
});

/**
 * Duplicates a Matrix3 instance.
 *
 * @param {Matrix3} matrix The matrix to duplicate.
 * @param {Matrix3} [result] The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided. (Returns undefined if matrix is undefined)
 */
Matrix3.clone = function (matrix, result) {
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
};

/**
 * Creates a Matrix3 instance from a column-major order array.
 *
 * @param {Number[]} values The column-major order array.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 */
Matrix3.fromColumnMajorArray = function (values, result) {
  return Matrix3.clone(values, result);
};

/**
 * Creates a Matrix3 instance from a row-major order array.
 * The resulting matrix will be in column-major order.
 *
 * @param {Number[]} values The row-major order array.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 */
Matrix3.fromRowMajorArray = function (values, result) {
  if (!defined(result)) {
    return new Matrix3(
      values[0],
      values[1],
      values[2],
      values[3],
      values[4],
      values[5],
      values[6],
      values[7],
      values[8]
    );
  }
  result[0] = values[0];
  result[1] = values[3];
  result[2] = values[6];
  result[3] = values[1];
  result[4] = values[4];
  result[5] = values[7];
  result[6] = values[2];
  result[7] = values[5];
  result[8] = values[8];
  return result;
};

/**
 * Computes a 3x3 rotation matrix from the provided quaternion.
 *
 * @param {Quaternion} quaternion the quaternion to use.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The 3x3 rotation matrix from this quaternion.
 */
Matrix3.fromQuaternion = function (quaternion, result) {
  const x2 = quaternion.x * quaternion.x;
  const xy = quaternion.x * quaternion.y;
  const xz = quaternion.x * quaternion.z;
  const xw = quaternion.x * quaternion.w;
  const y2 = quaternion.y * quaternion.y;
  const yz = quaternion.y * quaternion.z;
  const yw = quaternion.y * quaternion.w;
  const z2 = quaternion.z * quaternion.z;
  const zw = quaternion.z * quaternion.w;
  const w2 = quaternion.w * quaternion.w;

  const m00 = x2 - y2 - z2 + w2;
  const m01 = 2.0 * (xy - zw);
  const m02 = 2.0 * (xz + yw);

  const m10 = 2.0 * (xy + zw);
  const m11 = -x2 + y2 - z2 + w2;
  const m12 = 2.0 * (yz - xw);

  const m20 = 2.0 * (xz - yw);
  const m21 = 2.0 * (yz + xw);
  const m22 = -x2 - y2 + z2 + w2;

  if (!defined(result)) {
    return new Matrix3(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }
  result[0] = m00;
  result[1] = m10;
  result[2] = m20;
  result[3] = m01;
  result[4] = m11;
  result[5] = m21;
  result[6] = m02;
  result[7] = m12;
  result[8] = m22;
  return result;
};

/**
 * Computes a 3x3 rotation matrix from the provided headingPitchRoll. (see http://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles )
 *
 * @param {HeadingPitchRoll} headingPitchRoll the headingPitchRoll to use.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The 3x3 rotation matrix from this headingPitchRoll.
 */
Matrix3.fromHeadingPitchRoll = function (headingPitchRoll, result) {
  const cosTheta = Math.cos(-headingPitchRoll.pitch);
  const cosPsi = Math.cos(-headingPitchRoll.heading);
  const cosPhi = Math.cos(headingPitchRoll.roll);
  const sinTheta = Math.sin(-headingPitchRoll.pitch);
  const sinPsi = Math.sin(-headingPitchRoll.heading);
  const sinPhi = Math.sin(headingPitchRoll.roll);

  const m00 = cosTheta * cosPsi;
  const m01 = -cosPhi * sinPsi + sinPhi * sinTheta * cosPsi;
  const m02 = sinPhi * sinPsi + cosPhi * sinTheta * cosPsi;

  const m10 = cosTheta * sinPsi;
  const m11 = cosPhi * cosPsi + sinPhi * sinTheta * sinPsi;
  const m12 = -sinPhi * cosPsi + cosPhi * sinTheta * sinPsi;

  const m20 = -sinTheta;
  const m21 = sinPhi * cosTheta;
  const m22 = cosPhi * cosTheta;

  if (!defined(result)) {
    return new Matrix3(m00, m01, m02, m10, m11, m12, m20, m21, m22);
  }
  result[0] = m00;
  result[1] = m10;
  result[2] = m20;
  result[3] = m01;
  result[4] = m11;
  result[5] = m21;
  result[6] = m02;
  result[7] = m12;
  result[8] = m22;
  return result;
};

/**
 * Computes a Matrix3 instance representing a non-uniform scale.
 *
 * @param {Cartesian3} scale The x, y, and z scale factors.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Creates
 * //   [7.0, 0.0, 0.0]
 * //   [0.0, 8.0, 0.0]
 * //   [0.0, 0.0, 9.0]
 * const m = Matrix3.fromScale(new Cartesian3(7.0, 8.0, 9.0));
 */
Matrix3.fromScale = function (scale, result) {
  if (!defined(result)) {
    return new Matrix3(scale.x, 0.0, 0.0, 0.0, scale.y, 0.0, 0.0, 0.0, scale.z);
  }

  result[0] = scale.x;
  result[1] = 0.0;
  result[2] = 0.0;
  result[3] = 0.0;
  result[4] = scale.y;
  result[5] = 0.0;
  result[6] = 0.0;
  result[7] = 0.0;
  result[8] = scale.z;
  return result;
};

/**
 * Computes a Matrix3 instance representing a uniform scale.
 *
 * @param {Number} scale The uniform scale factor.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Creates
 * //   [2.0, 0.0, 0.0]
 * //   [0.0, 2.0, 0.0]
 * //   [0.0, 0.0, 2.0]
 * const m = Matrix3.fromUniformScale(2.0);
 */
Matrix3.fromUniformScale = function (scale, result) {
  if (!defined(result)) {
    return new Matrix3(scale, 0.0, 0.0, 0.0, scale, 0.0, 0.0, 0.0, scale);
  }

  result[0] = scale;
  result[1] = 0.0;
  result[2] = 0.0;
  result[3] = 0.0;
  result[4] = scale;
  result[5] = 0.0;
  result[6] = 0.0;
  result[7] = 0.0;
  result[8] = scale;
  return result;
};

/**
 * Computes a Matrix3 instance representing the cross product equivalent matrix of a Cartesian3 vector.
 *
 * @param {Cartesian3} vector the vector on the left hand side of the cross product operation.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Creates
 * //   [0.0, -9.0,  8.0]
 * //   [9.0,  0.0, -7.0]
 * //   [-8.0, 7.0,  0.0]
 * const m = Matrix3.fromCrossProduct(new Cartesian3(7.0, 8.0, 9.0));
 */
Matrix3.fromCrossProduct = function (vector, result) {
  if (!defined(result)) {
    return new Matrix3(
      0.0,
      -vector.z,
      vector.y,
      vector.z,
      0.0,
      -vector.x,
      -vector.y,
      vector.x,
      0.0
    );
  }

  result[0] = 0.0;
  result[1] = vector.z;
  result[2] = -vector.y;
  result[3] = -vector.z;
  result[4] = 0.0;
  result[5] = vector.x;
  result[6] = vector.y;
  result[7] = -vector.x;
  result[8] = 0.0;
  return result;
};

/**
 * Creates a rotation matrix around the x-axis.
 *
 * @param {Number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Rotate a point 45 degrees counterclockwise around the x-axis.
 * const p = new Cartesian3(5, 6, 7);
 * const m = Matrix3.fromRotationX(Math.toRadians(45.0));
 * const rotated = Matrix3.multiplyByVector(m, p, new Cartesian3());
 */
Matrix3.fromRotationX = function (angle, result) {
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);

  if (!defined(result)) {
    return new Matrix3(
      1.0,
      0.0,
      0.0,
      0.0,
      cosAngle,
      -sinAngle,
      0.0,
      sinAngle,
      cosAngle
    );
  }

  result[0] = 1.0;
  result[1] = 0.0;
  result[2] = 0.0;
  result[3] = 0.0;
  result[4] = cosAngle;
  result[5] = sinAngle;
  result[6] = 0.0;
  result[7] = -sinAngle;
  result[8] = cosAngle;

  return result;
};

/**
 * Creates a rotation matrix around the y-axis.
 *
 * @param {Number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Rotate a point 45 degrees counterclockwise around the y-axis.
 * const p = new Cartesian3(5, 6, 7);
 * const m = Matrix3.fromRotationY(toRadians(45.0));
 * const rotated = Matrix3.multiplyByVector(m, p, new Cartesian3());
 */
Matrix3.fromRotationY = function (angle, result) {
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);

  if (!defined(result)) {
    return new Matrix3(
      cosAngle,
      0.0,
      sinAngle,
      0.0,
      1.0,
      0.0,
      -sinAngle,
      0.0,
      cosAngle
    );
  }

  result[0] = cosAngle;
  result[1] = 0.0;
  result[2] = -sinAngle;
  result[3] = 0.0;
  result[4] = 1.0;
  result[5] = 0.0;
  result[6] = sinAngle;
  result[7] = 0.0;
  result[8] = cosAngle;

  return result;
};

/**
 * Creates a rotation matrix around the z-axis.
 *
 * @param {Number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
 * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
 * @returns {Matrix3} The modified result parameter, or a new Matrix3 instance if one was not provided.
 *
 * @example
 * // Rotate a point 45 degrees counterclockwise around the z-axis.
 * const p = new Cartesian3(5, 6, 7);
 * const m = Matrix3.fromRotationZ(Math.toRadians(45.0));
 * const rotated = Matrix3.multiplyByVector(m, p, new Cartesian3());
 */
Matrix3.fromRotationZ = function (angle, result) {
  const cosAngle = Math.cos(angle);
  const sinAngle = Math.sin(angle);

  if (!defined(result)) {
    return new Matrix3(
      cosAngle,
      -sinAngle,
      0.0,
      sinAngle,
      cosAngle,
      0.0,
      0.0,
      0.0,
      1.0
    );
  }

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
};

/**
 * Computes the product of a matrix and a column vector.
 *
 * @param {Matrix3} matrix The matrix.
 * @param {Cartesian3} cartesian The column.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Matrix3.multiplyByVector = function (matrix, cartesian, result) {
  const vX = cartesian.x;
  const vY = cartesian.y;
  const vZ = cartesian.z;

  const x = matrix[0] * vX + matrix[3] * vY + matrix[6] * vZ;
  const y = matrix[1] * vX + matrix[4] * vY + matrix[7] * vZ;
  const z = matrix[2] * vX + matrix[5] * vY + matrix[8] * vZ;

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};


/**
 * Computes the product of a matrix and a scalar.
 *
 * @param {Matrix3} matrix The matrix.
 * @param {Number} scalar The number to multiply by.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.multiplyByScalar = function (matrix, scalar, result) {
  result[0] = matrix[0] * scalar;
  result[1] = matrix[1] * scalar;
  result[2] = matrix[2] * scalar;
  result[3] = matrix[3] * scalar;
  result[4] = matrix[4] * scalar;
  result[5] = matrix[5] * scalar;
  result[6] = matrix[6] * scalar;
  result[7] = matrix[7] * scalar;
  result[8] = matrix[8] * scalar;
  return result;
};

/**
 * Computes the determinant of the provided matrix.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @returns {Number} The value of the determinant of the matrix.
 */
Matrix3.determinant = function (matrix) {
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
};

/**
 * Computes the inverse of the provided matrix.
 *
 * @param {Matrix3} matrix The matrix to invert.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 *
 * @exception {Error} matrix is not invertible.
 */
Matrix3.inverse = function (matrix, result) {
  const m11 = matrix[0];
  const m21 = matrix[1];
  const m31 = matrix[2];
  const m12 = matrix[3];
  const m22 = matrix[4];
  const m32 = matrix[5];
  const m13 = matrix[6];
  const m23 = matrix[7];
  const m33 = matrix[8];

  const determinant = Matrix3.determinant(matrix);

  if (Math.abs(determinant) <= MMath.EPSILON15) {
    throw new Error("matrix is not invertible");
  }

  result[0] = m22 * m33 - m23 * m32;
  result[1] = m23 * m31 - m21 * m33;
  result[2] = m21 * m32 - m22 * m31;
  result[3] = m13 * m32 - m12 * m33;
  result[4] = m11 * m33 - m13 * m31;
  result[5] = m12 * m31 - m11 * m32;
  result[6] = m12 * m23 - m13 * m22;
  result[7] = m13 * m21 - m11 * m23;
  result[8] = m11 * m22 - m12 * m21;

  const scale = 1.0 / determinant;
  return Matrix3.multiplyByScalar(result, scale, result);
};

/**
 * Computes the transpose of the provided matrix.
 *
 * @param {Matrix3} matrix The matrix to transpose.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.transpose = function (matrix, result) {
  const column0Row0 = matrix[0];
  const column0Row1 = matrix[3];
  const column0Row2 = matrix[6];
  const column1Row0 = matrix[1];
  const column1Row1 = matrix[4];
  const column1Row2 = matrix[7];
  const column2Row0 = matrix[2];
  const column2Row1 = matrix[5];
  const column2Row2 = matrix[8];

  result[0] = column0Row0;
  result[1] = column0Row1;
  result[2] = column0Row2;
  result[3] = column1Row0;
  result[4] = column1Row1;
  result[5] = column1Row2;
  result[6] = column2Row0;
  result[7] = column2Row1;
  result[8] = column2Row2;
  return result;
};

/**
 * Retrieves a copy of the matrix column at the provided index as a Cartesian3 instance.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {Number} index The zero-based index of the column to retrieve.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Matrix3.getColumn = function (matrix, index, result) {
  const startIndex = index * 3;
  const x = matrix[startIndex];
  const y = matrix[startIndex + 1];
  const z = matrix[startIndex + 2];

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * Computes a new matrix that replaces the specified column in the provided matrix with the provided Cartesian3 instance.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {Number} index The zero-based index of the column to set.
 * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified column.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.setColumn = function (matrix, index, cartesian, result) {
  result = Matrix3.clone(matrix, result);
  const startIndex = index * 3;
  result[startIndex] = cartesian.x;
  result[startIndex + 1] = cartesian.y;
  result[startIndex + 2] = cartesian.z;
  return result;
};

/**
 * Retrieves a copy of the matrix row at the provided index as a Cartesian3 instance.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {Number} index The zero-based index of the row to retrieve.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Matrix3.getRow = function (matrix, index, result) {
  const x = matrix[index];
  const y = matrix[index + 3];
  const z = matrix[index + 6];

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * Computes a new matrix that replaces the specified row in the provided matrix with the provided Cartesian3 instance.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {Number} index The zero-based index of the row to set.
 * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified row.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.setRow = function (matrix, index, cartesian, result) {
  result = Matrix3.clone(matrix, result);
  result[index] = cartesian.x;
  result[index + 3] = cartesian.y;
  result[index + 6] = cartesian.z;
  return result;
};

const scaleScratch1 = new Cartesian3();

/**
 * Computes a new matrix that replaces the scale with the provided scale.
 * This assumes the matrix is an affine transformation.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {Cartesian3} scale The scale that replaces the scale of the provided matrix.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.setScale = function (matrix, scale, result) {
  const existingScale = Matrix3.getScale(matrix, scaleScratch1);
  const scaleRatioX = scale.x / existingScale.x;
  const scaleRatioY = scale.y / existingScale.y;
  const scaleRatioZ = scale.z / existingScale.z;

  result[0] = matrix[0] * scaleRatioX;
  result[1] = matrix[1] * scaleRatioX;
  result[2] = matrix[2] * scaleRatioX;
  result[3] = matrix[3] * scaleRatioY;
  result[4] = matrix[4] * scaleRatioY;
  result[5] = matrix[5] * scaleRatioY;
  result[6] = matrix[6] * scaleRatioZ;
  result[7] = matrix[7] * scaleRatioZ;
  result[8] = matrix[8] * scaleRatioZ;

  return result;
};

const scaleScratch2 = new Cartesian3();

/**
 * Computes a new matrix that replaces the scale with the provided uniform scale.
 * This assumes the matrix is an affine transformation.
 *
 * @param {Matrix3} matrix The matrix to use.
 * @param {Number} scale The uniform scale that replaces the scale of the provided matrix.
 * @param {Matrix3} result The object onto which to store the result.
 * @returns {Matrix3} The modified result parameter.
 */
Matrix3.setUniformScale = function (matrix, scale, result) {
  const existingScale = Matrix3.getScale(matrix, scaleScratch2);
  const scaleRatioX = scale / existingScale.x;
  const scaleRatioY = scale / existingScale.y;
  const scaleRatioZ = scale / existingScale.z;

  result[0] = matrix[0] * scaleRatioX;
  result[1] = matrix[1] * scaleRatioX;
  result[2] = matrix[2] * scaleRatioX;
  result[3] = matrix[3] * scaleRatioY;
  result[4] = matrix[4] * scaleRatioY;
  result[5] = matrix[5] * scaleRatioY;
  result[6] = matrix[6] * scaleRatioZ;
  result[7] = matrix[7] * scaleRatioZ;
  result[8] = matrix[8] * scaleRatioZ;

  return result;
};

const scratchColumn = new Cartesian3();

/**
 * Extracts the non-uniform scale assuming the matrix is an affine transformation.
 *
 * @param {Matrix3} matrix The matrix.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Matrix3.getScale = function (matrix, result) {
  result.x = Cartesian3.magnitude(
    Cartesian3.fromElements(matrix[0], matrix[1], matrix[2], scratchColumn)
  );
  result.y = Cartesian3.magnitude(
    Cartesian3.fromElements(matrix[3], matrix[4], matrix[5], scratchColumn)
  );
  result.z = Cartesian3.magnitude(
    Cartesian3.fromElements(matrix[6], matrix[7], matrix[8], scratchColumn)
  );
  return result;
};


/**
 * An immutable Matrix3 instance initialized to the identity matrix.
 *
 * @type {Matrix3}
 * @constant
 */
Matrix3.IDENTITY = Object.freeze(
  new Matrix3(1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0)
);


/**
 * Computes a string representing this Matrix with each row being
 * on a separate line and in the format '(column0, column1, column2, column3)'.
 *
 * @returns {String} A string representing the provided Matrix with each row being on a separate line and in the format '(column0, column1, column2, column3)'.
 */
Matrix3.prototype.toString = function () {
  return (
    `(${this[0]}, ${this[3]}, ${this[6]})\n` +
    `(${this[1]}, ${this[4]}, ${this[7]})\n` +
    `(${this[2]}, ${this[5]}, ${this[8]})\n`
  );
};

export default Matrix3;
