import defaultValue from '../defaultValue.js';
import defined from '../defined.js';
import * as MMath from './Math.js';

/**
 * A 4D Cartesian point.
 * @alias Cartesian4
 * @constructor
 *
 * @param {Number} [x=0.0] The X component.
 * @param {Number} [y=0.0] The Y component.
 * @param {Number} [z=0.0] The Z component.
 * @param {Number} [w=0.0] The W component.
 */
function Cartesian4(x, y, z, w) {
  /**
   * The X component.
   * @type {Number}
   * @default 0.0
   */
  this.x = defaultValue(x, 0.0);

  /**
   * The Y component.
   * @type {Number}
   * @default 0.0
   */
  this.y = defaultValue(y, 0.0);

  /**
   * The Z component.
   * @type {Number}
   * @default 0.0
   */
  this.z = defaultValue(z, 0.0);

  /**
   * The W component.
   * @type {Number}
   * @default 0.0
   */
  this.w = defaultValue(w, 0.0);
}

/**
 * Duplicates a Cartesian4 instance.
 *
 * @param {Cartesian4} cartesian The Cartesian to duplicate.
 * @param {Cartesian4} [result] The object onto which to store the result.
 * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided. (Returns undefined if cartesian is undefined)
 */
Cartesian4.clone = function (cartesian, result) {
  if (!defined(cartesian)) {
    return undefined;
  }

  if (!defined(result)) {
    return new Cartesian4(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
  }

  result.x = cartesian.x;
  result.y = cartesian.y;
  result.z = cartesian.z;
  result.w = cartesian.w;
  return result;
};

/**
 * Computes the provided Cartesian's squared magnitude.
 *
 * @param {Cartesian4} cartesian The Cartesian instance whose squared magnitude is to be computed.
 * @returns {Number} The squared magnitude.
 */
Cartesian4.magnitudeSquared = function (cartesian) {
  return (
    cartesian.x * cartesian.x +
    cartesian.y * cartesian.y +
    cartesian.z * cartesian.z +
    cartesian.w * cartesian.w
  );
};

/**
 * Computes the Cartesian's magnitude (length).
 *
 * @param {Cartesian4} cartesian The Cartesian instance whose magnitude is to be computed.
 * @returns {Number} The magnitude.
 */
Cartesian4.magnitude = function (cartesian) {
  return Math.sqrt(Cartesian4.magnitudeSquared(cartesian));
};

const distanceScratch = new Cartesian4();

/**
 * Computes the 4-space distance between two points.
 *
 * @param {Cartesian4} left The first point to compute the distance from.
 * @param {Cartesian4} right The second point to compute the distance to.
 * @returns {Number} The distance between two points.
 *
 * @example
 * // Returns 1.0
 * const d = Cartesian4.distance(
 *   new Cartesian4(1.0, 0.0, 0.0, 0.0),
 *   new Cartesian4(2.0, 0.0, 0.0, 0.0));
 */
Cartesian4.distance = function (left, right) {
  Cartesian4.subtract(left, right, distanceScratch);
  return Cartesian4.magnitude(distanceScratch);
};

/**
 * Computes the normalized form of the supplied Cartesian.
 *
 * @param {Cartesian4} cartesian The Cartesian to be normalized.
 * @param {Cartesian4} result The object onto which to store the result.
 * @returns {Cartesian4} The modified result parameter.
 */
Cartesian4.normalize = function (cartesian, result) {
  const magnitude = Cartesian4.magnitude(cartesian);

  result.x = cartesian.x / magnitude;
  result.y = cartesian.y / magnitude;
  result.z = cartesian.z / magnitude;
  result.w = cartesian.w / magnitude;

  if (
    isNaN(result.x) ||
    isNaN(result.y) ||
    isNaN(result.z) ||
    isNaN(result.w)
  ) {
    throw new Error("normalized result is not a number");
  }

  return result;
};

/**
 * Computes the dot (scalar) product of two Cartesians.
 *
 * @param {Cartesian4} left The first Cartesian.
 * @param {Cartesian4} right The second Cartesian.
 * @returns {Number} The dot product.
 */
Cartesian4.dot = function (left, right) {
  return (
    left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w
  );
};

/**
 * Computes the componentwise product of two Cartesians.
 *
 * @param {Cartesian4} left The first Cartesian.
 * @param {Cartesian4} right The second Cartesian.
 * @param {Cartesian4} result The object onto which to store the result.
 * @returns {Cartesian4} The modified result parameter.
 */
Cartesian4.multiplyComponents = function (left, right, result) {

  result.x = left.x * right.x;
  result.y = left.y * right.y;
  result.z = left.z * right.z;
  result.w = left.w * right.w;
  return result;
};


/**
 * Computes the componentwise quotient of two Cartesians.
 *
 * @param {Cartesian4} left The first Cartesian.
 * @param {Cartesian4} right The second Cartesian.
 * @param {Cartesian4} result The object onto which to store the result.
 * @returns {Cartesian4} The modified result parameter.
 */
Cartesian4.divideComponents = function (left, right, result) {
  result.x = left.x / right.x;
  result.y = left.y / right.y;
  result.z = left.z / right.z;
  result.w = left.w / right.w;
  return result;
};

/**
 * Computes the componentwise sum of two Cartesians.
 *
 * @param {Cartesian4} left The first Cartesian.
 * @param {Cartesian4} right The second Cartesian.
 * @param {Cartesian4} result The object onto which to store the result.
 * @returns {Cartesian4} The modified result parameter.
 */
Cartesian4.add = function (left, right, result) {
  result.x = left.x + right.x;
  result.y = left.y + right.y;
  result.z = left.z + right.z;
  result.w = left.w + right.w;
  return result;
};

/**
 * Computes the componentwise difference of two Cartesians.
 *
 * @param {Cartesian4} left The first Cartesian.
 * @param {Cartesian4} right The second Cartesian.
 * @param {Cartesian4} result The object onto which to store the result.
 * @returns {Cartesian4} The modified result parameter.
 */
Cartesian4.subtract = function (left, right, result) {
  result.x = left.x - right.x;
  result.y = left.y - right.y;
  result.z = left.z - right.z;
  result.w = left.w - right.w;
  return result;
};

/**
 * Multiplies the provided Cartesian componentwise by the provided scalar.
 *
 * @param {Cartesian4} cartesian The Cartesian to be scaled.
 * @param {Number} scalar The scalar to multiply with.
 * @param {Cartesian4} result The object onto which to store the result.
 * @returns {Cartesian4} The modified result parameter.
 */
Cartesian4.multiplyByScalar = function (cartesian, scalar, result) {
  result.x = cartesian.x * scalar;
  result.y = cartesian.y * scalar;
  result.z = cartesian.z * scalar;
  result.w = cartesian.w * scalar;
  return result;
};

/**
 * Divides the provided Cartesian componentwise by the provided scalar.
 *
 * @param {Cartesian4} cartesian The Cartesian to be divided.
 * @param {Number} scalar The scalar to divide by.
 * @param {Cartesian4} result The object onto which to store the result.
 * @returns {Cartesian4} The modified result parameter.
 */
Cartesian4.divideByScalar = function (cartesian, scalar, result) {
  result.x = cartesian.x / scalar;
  result.y = cartesian.y / scalar;
  result.z = cartesian.z / scalar;
  result.w = cartesian.w / scalar;
  return result;
};

/**
 * Negates the provided Cartesian.
 *
 * @param {Cartesian4} cartesian The Cartesian to be negated.
 * @param {Cartesian4} result The object onto which to store the result.
 * @returns {Cartesian4} The modified result parameter.
 */
Cartesian4.negate = function (cartesian, result) {
  result.x = -cartesian.x;
  result.y = -cartesian.y;
  result.z = -cartesian.z;
  result.w = -cartesian.w;
  return result;
};

/**
 * Compares the provided Cartesians componentwise and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Cartesian4} [left] The first Cartesian.
 * @param {Cartesian4} [right] The second Cartesian.
 * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
 */
Cartesian4.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.x === right.x &&
      left.y === right.y &&
      left.z === right.z &&
      left.w === right.w)
  );
};

/**
 * Compares the provided Cartesians componentwise and returns
 * <code>true</code> if they pass an absolute or relative tolerance test,
 * <code>false</code> otherwise.
 *
 * @param {Cartesian4} [left] The first Cartesian.
 * @param {Cartesian4} [right] The second Cartesian.
 * @param {Number} [relativeEpsilon=0] The relative epsilon tolerance to use for equality testing.
 * @param {Number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
 * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
 */
Cartesian4.equalsEpsilon = function (
  left,
  right,
  relativeEpsilon,
  absoluteEpsilon
) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      MMath.equalsEpsilon(
        left.x,
        right.x,
        relativeEpsilon,
        absoluteEpsilon
      ) &&
      MMath.equalsEpsilon(
        left.y,
        right.y,
        relativeEpsilon,
        absoluteEpsilon
      ) &&
      MMath.equalsEpsilon(
        left.z,
        right.z,
        relativeEpsilon,
        absoluteEpsilon
      ) &&
      MMath.equalsEpsilon(
        left.w,
        right.w,
        relativeEpsilon,
        absoluteEpsilon
      ))
  );
};

/**
 * Duplicates this Cartesian4 instance.
 *
 * @param {Cartesian4} [result] The object onto which to store the result.
 * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
 */
Cartesian4.prototype.clone = function (result) {
  return Cartesian4.clone(this, result);
};

/**
 * Compares this Cartesian against the provided Cartesian componentwise and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Cartesian4} [right] The right hand side Cartesian.
 * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
 */
Cartesian4.prototype.equals = function (right) {
  return Cartesian4.equals(this, right);
};

/**
 * Compares this Cartesian against the provided Cartesian componentwise and returns
 * <code>true</code> if they pass an absolute or relative tolerance test,
 * <code>false</code> otherwise.
 *
 * @param {Cartesian4} [right] The right hand side Cartesian.
 * @param {Number} [relativeEpsilon=0] The relative epsilon tolerance to use for equality testing.
 * @param {Number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
 * @returns {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
 */
Cartesian4.prototype.equalsEpsilon = function (
  right,
  relativeEpsilon,
  absoluteEpsilon
) {
  return Cartesian4.equalsEpsilon(
    this,
    right,
    relativeEpsilon,
    absoluteEpsilon
  );
};

/**
 * Creates a string representing this Cartesian in the format '(x, y, z, w)'.
 *
 * @returns {String} A string representing the provided Cartesian in the format '(x, y, z, w)'.
 */
Cartesian4.prototype.toString = function () {
  return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
};

export default Cartesian4;
