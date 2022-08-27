import defaultValue from '../defaultValue.js';
import defined from '../defined.js';
import * as MMath from './Math.js';

/**
 * A 3D Cartesian point.
 * @alias Cartesian3
 * @constructor
 *
 * @param {Number} [x=0.0] The X component.
 * @param {Number} [y=0.0] The Y component.
 * @param {Number} [z=0.0] The Z component.
 */
function Cartesian3(x, y, z) {
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
}

/**
 * Creates a Cartesian3 instance from x, y and z coordinates.
 *
 * @param {Number} x The x coordinate.
 * @param {Number} y The y coordinate.
 * @param {Number} z The z coordinate.
 * @param {Cartesian3} [result] The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
 */
Cartesian3.fromElements = function (x, y, z, result) {
  if (!defined(result)) {
    return new Cartesian3(x, y, z);
  }

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * Converts the provided Spherical into Cartesian3 coordinates.
 *
 * @param {Spherical} spherical The Spherical to be converted to Cartesian3.
 * @param {Cartesian3} [result] The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
 */
Cartesian3.fromSpherical = function(spherical, result) {
  if (!defined(result)) {
    result = new Cartesian3();
  }

  const phi = spherical.phi;
  const theta = spherical.theta;
  const radius = defaultValue(spherical.radius, 1.0);

  const sinTheta = Math.sin(theta);
  result.x = Math.cos(phi) * sinTheta * radius;
  result.y = Math.sin(phi) * sinTheta * radius;
  result.z = Math.cos(theta) * radius;

  return result;
}

/**
 * Duplicates a Cartesian3 instance.
 *
 * @param {Cartesian3} cartesian The Cartesian to duplicate.
 * @param {Cartesian3} [result] The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided. (Returns undefined if cartesian is undefined)
 */
Cartesian3.clone = function (cartesian, result) {
  if (!defined(cartesian)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Cartesian3(cartesian.x, cartesian.y, cartesian.z);
  }

  result.x = cartesian.x;
  result.y = cartesian.y;
  result.z = cartesian.z;
  return result;
};

/**
 * Computes the provided Cartesian's squared magnitude.
 *
 * @param {Cartesian3} cartesian The Cartesian instance whose squared magnitude is to be computed.
 * @returns {Number} The squared magnitude.
 */
Cartesian3.magnitudeSquared = function (cartesian) {
  return (
    cartesian.x * cartesian.x +
    cartesian.y * cartesian.y +
    cartesian.z * cartesian.z
  );
};

/**
 * Computes the Cartesian's magnitude (length).
 *
 * @param {Cartesian3} cartesian The Cartesian instance whose magnitude is to be computed.
 * @returns {Number} The magnitude.
 */
Cartesian3.magnitude = function (cartesian) {
  return Math.sqrt(Cartesian3.magnitudeSquared(cartesian));
};


const distanceScratch = new Cartesian3();

/**
 * Computes the distance between two points.
 *
 * @param {Cartesian3} left The first point to compute the distance from.
 * @param {Cartesian3} right The second point to compute the distance to.
 * @returns {Number} The distance between two points.
 *
 * @example
 * // Returns 1.0
 * const d = Cartesian3.distance(new Cartesian3(1.0, 0.0, 0.0), new Cartesian3(2.0, 0.0, 0.0));
 */
Cartesian3.distance = function (left, right) {

  Cartesian3.subtract(left, right, distanceScratch);
  return Cartesian3.magnitude(distanceScratch);
};

/**
 * Computes the normalized form of the supplied Cartesian.
 *
 * @param {Cartesian3} cartesian The Cartesian to be normalized.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
 Cartesian3.normalize = function (cartesian, result) {
  const magnitude = Cartesian3.magnitude(cartesian);

  result.x = cartesian.x / magnitude;
  result.y = cartesian.y / magnitude;
  result.z = cartesian.z / magnitude;

  if (isNaN(result.x) || isNaN(result.y) || isNaN(result.z)) {
    throw new Error("normalized result is not a number");
  }

  return result;
};


/**
 * Computes the dot (scalar) product of two Cartesians.
 *
 * @param {Cartesian3} left The first Cartesian.
 * @param {Cartesian3} right The second Cartesian.
 * @returns {Number} The dot product.
 */
 Cartesian3.dot = function (left, right) {
  return left.x * right.x + left.y * right.y + left.z * right.z;
};

/**
 * Computes the componentwise product of two Cartesians.
 *
 * @param {Cartesian3} left The first Cartesian.
 * @param {Cartesian3} right The second Cartesian.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
 Cartesian3.multiplyComponents = function (left, right, result) {
  result.x = left.x * right.x;
  result.y = left.y * right.y;
  result.z = left.z * right.z;
  return result;
};

/**
 * Computes the componentwise quotient of two Cartesians.
 *
 * @param {Cartesian3} left The first Cartesian.
 * @param {Cartesian3} right The second Cartesian.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
 Cartesian3.divideComponents = function (left, right, result) {
  result.x = left.x / right.x;
  result.y = left.y / right.y;
  result.z = left.z / right.z;
  return result;
};

/**
 * Computes the componentwise sum of two Cartesians.
 *
 * @param {Cartesian3} left The first Cartesian.
 * @param {Cartesian3} right The second Cartesian.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
 Cartesian3.add = function (left, right, result) {
  result.x = left.x + right.x;
  result.y = left.y + right.y;
  result.z = left.z + right.z;
  return result;
};

/**
 * Computes the componentwise difference of two Cartesians.
 *
 * @param {Cartesian3} left The first Cartesian.
 * @param {Cartesian3} right The second Cartesian.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Cartesian3.subtract = function (left, right, result) {
  result.x = left.x - right.x;
  result.y = left.y - right.y;
  result.z = left.z - right.z;
  return result;
};

/**
 * Multiplies the provided Cartesian componentwise by the provided scalar.
 *
 * @param {Cartesian3} cartesian The Cartesian to be scaled.
 * @param {Number} scalar The scalar to multiply with.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Cartesian3.multiplyByScalar = function (cartesian, scalar, result) {
  result.x = cartesian.x * scalar;
  result.y = cartesian.y * scalar;
  result.z = cartesian.z * scalar;
  return result;
};

/**
 * Divides the provided Cartesian componentwise by the provided scalar.
 *
 * @param {Cartesian3} cartesian The Cartesian to be divided.
 * @param {Number} scalar The scalar to divide by.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
 Cartesian3.divideByScalar = function (cartesian, scalar, result) {
  result.x = cartesian.x / scalar;
  result.y = cartesian.y / scalar;
  result.z = cartesian.z / scalar;
  return result;
};

/**
 * Negates the provided Cartesian.
 *
 * @param {Cartesian3} cartesian The Cartesian to be negated.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter.
 */
Cartesian3.negate = function (cartesian, result) {
  result.x = -cartesian.x;
  result.y = -cartesian.y;
  result.z = -cartesian.z;
  return result;
};


/**
 * Compares the provided Cartesians componentwise and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Cartesian3} [left] The first Cartesian.
 * @param {Cartesian3} [right] The second Cartesian.
 * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
 */
 Cartesian3.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.x === right.x &&
      left.y === right.y &&
      left.z === right.z)
  );
};

/**
 * Compares the provided Cartesians componentwise and returns
 * <code>true</code> if they pass an absolute or relative tolerance test,
 * <code>false</code> otherwise.
 *
 * @param {Cartesian3} [left] The first Cartesian.
 * @param {Cartesian3} [right] The second Cartesian.
 * @param {Number} [relativeEpsilon=0] The relative epsilon tolerance to use for equality testing.
 * @param {Number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
 * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
 */
 Cartesian3.equalsEpsilon = function (
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
      ))
  );
};

/**
 * Computes the cross (outer) product of two Cartesians.
 *
 * @param {Cartesian3} left The first Cartesian.
 * @param {Cartesian3} right The second Cartesian.
 * @param {Cartesian3} result The object onto which to store the result.
 * @returns {Cartesian3} The cross product.
 */
 Cartesian3.cross = function (left, right, result) {
  const leftX = left.x;
  const leftY = left.y;
  const leftZ = left.z;
  const rightX = right.x;
  const rightY = right.y;
  const rightZ = right.z;

  const x = leftY * rightZ - leftZ * rightY;
  const y = leftZ * rightX - leftX * rightZ;
  const z = leftX * rightY - leftY * rightX;

  result.x = x;
  result.y = y;
  result.z = z;
  return result;
};

/**
 * An immutable Cartesian3 instance initialized to (0.0, 0.0, 0.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.ZERO = Object.freeze(new Cartesian3(0.0, 0.0, 0.0));

/**
 * An immutable Cartesian3 instance initialized to (1.0, 1.0, 1.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.ONE = Object.freeze(new Cartesian3(1.0, 1.0, 1.0));
 
/**
 * An immutable Cartesian3 instance initialized to (1.0, 0.0, 0.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.UNIT_X = Object.freeze(new Cartesian3(1.0, 0.0, 0.0));
 
/**
 * An immutable Cartesian3 instance initialized to (0.0, 1.0, 0.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.UNIT_Y = Object.freeze(new Cartesian3(0.0, 1.0, 0.0));
 
/**
 * An immutable Cartesian3 instance initialized to (0.0, 0.0, 1.0).
 *
 * @type {Cartesian3}
 * @constant
 */
Cartesian3.UNIT_Z = Object.freeze(new Cartesian3(0.0, 0.0, 1.0));
 

/**
 * Duplicates this Cartesian3 instance.
 *
 * @param {Cartesian3} [result] The object onto which to store the result.
 * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
 */
Cartesian3.prototype.clone = function (result) {
  return Cartesian3.clone(this, result);
};

/**
 * Compares this Cartesian against the provided Cartesian componentwise and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Cartesian3} [right] The right hand side Cartesian.
 * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
 */
Cartesian3.prototype.equals = function (right) {
  return Cartesian3.equals(this, right);
};

/**
 * Compares this Cartesian against the provided Cartesian componentwise and returns
 * <code>true</code> if they pass an absolute or relative tolerance test,
 * <code>false</code> otherwise.
 *
 * @param {Cartesian3} [right] The right hand side Cartesian.
 * @param {Number} [relativeEpsilon=0] The relative epsilon tolerance to use for equality testing.
 * @param {Number} [absoluteEpsilon=relativeEpsilon] The absolute epsilon tolerance to use for equality testing.
 * @returns {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
 */
Cartesian3.prototype.equalsEpsilon = function (
  right,
  relativeEpsilon,
  absoluteEpsilon
) {
  return Cartesian3.equalsEpsilon(
    this,
    right,
    relativeEpsilon,
    absoluteEpsilon
  );
};

/**
 * Creates a string representing this Cartesian in the format '(x, y, z)'.
 *
 * @returns {String} A string representing this Cartesian in the format '(x, y, z)'.
 */
Cartesian3.prototype.toString = function () {
  return `(${this.x}, ${this.y}, ${this.z})`;
};

export default Cartesian3;
