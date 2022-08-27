import defaultValue from '../defaultValue.js';

/**
 * Math functions.
 *
 * @exports MMath
 * @alias Math
 */
const MMath = {};

/**
 * 0.1
 * @type {Number}
 * @constant
 */
MMath.EPSILON1 = 1e-1;

/**
 * 0.01
 * @type {Number}
 * @constant
 */
MMath.EPSILON2 = 1e-2;

/**
 * 0.001
 * @type {Number}
 * @constant
 */
MMath.EPSILON3 = 1e-3;

/**
 * 0.0001
 * @type {Number}
 * @constant
 */
MMath.EPSILON4 = 1e-4;

/**
 * 0.00001
 * @type {Number}
 * @constant
 */
MMath.EPSILON5 = 1e-5;

/**
 * 0.000001
 * @type {Number}
 * @constant
 */
MMath.EPSILON6 = 1e-6;

/**
 * 1e-7
 * @type {Number}
 * @constant
 */
MMath.EPSILON7 = 1e-7;

/**
 * 1e-8
 * @type {Number}
 * @constant
 */
MMath.EPSILON8 = 1e-8;

/**
 * 1e-9
 * @type {Number}
 * @constant
 */
MMath.EPSILON9 = 1e-9;

/**
 * 1e-10
 * @type {Number}
 * @constant
 */
MMath.EPSILON10 = 1e-10;

/**
 * 1e-11
 * @type {Number}
 * @constant
 */
MMath.EPSILON11 = 1e-11;

/**
 * 1e-12
 * @type {Number}
 * @constant
 */
MMath.EPSILON12 = 1e-12;

/**
 * 1e-13
 * @type {Number}
 * @constant
 */
MMath.EPSILON13 = 1e-13;

/**
 * 1e-14
 * @type {Number}
 * @constant
 */
MMath.EPSILON14 = 1e-14;

/**
 * 1e-15
 * @type {Number}
 * @constant
 */
MMath.EPSILON15 = 1e-15;

/**
 * Determines if two values are equal using an absolute or relative tolerance test. This is useful
 * to avoid problems due to roundoff error when comparing floating-point values directly. The values are
 * first compared using an absolute tolerance test. If that fails, a relative tolerance test is performed.
 * Use this test if you are unsure of the magnitudes of left and right.
 *
 * @param {Number} left The first value to compare.
 * @param {Number} right The other value to compare.
 * @param {Number} [relativeEpsilon=0] The maximum inclusive delta between <code>left</code> and <code>right</code> for the relative tolerance test.
 * @param {Number} [absoluteEpsilon=relativeEpsilon] The maximum inclusive delta between <code>left</code> and <code>right</code> for the absolute tolerance test.
 * @returns {Boolean} <code>true</code> if the values are equal within the epsilon; otherwise, <code>false</code>.
 *
 * @example
 * const a = equalsEpsilon(0.0, 0.01, EPSILON2); // true
 * const b = equalsEpsilon(0.0, 0.1, EPSILON2);  // false
 * const c = equalsEpsilon(3699175.1634344, 3699175.2, EPSILON7); // true
 * const d = equalsEpsilon(3699175.1634344, 3699175.2, EPSILON9); // false
 */
MMath.equalsEpsilon = function(
  left,
  right,
  relativeEpsilon,
  absoluteEpsilon
) {
  relativeEpsilon = defaultValue(relativeEpsilon, 0.0);
  absoluteEpsilon = defaultValue(absoluteEpsilon, relativeEpsilon);
  const absDiff = Math.abs(left - right);
  return (
    absDiff <= absoluteEpsilon ||
    absDiff <= relativeEpsilon * Math.max(Math.abs(left), Math.abs(right))
  );
};

/**
 * Converts degrees to radians.
 *
 * @param {Number} degrees The angle to convert in degrees.
 * @returns {Number} The corresponding angle in radians.
 */
MMath.toRadians = function(degrees) {
  return degrees / 180 * Math.PI;
};

/**
 * Converts radians to degrees.
 * @param {Number} radians The angle to convert in radians.
 * @returns {Number} The corresponding angle in degrees.
 */
MMath.toDegrees = function(radians) {
  return radians / Math.PI * 180;
};

/**
 * Constraint a value to lie between two values.
 *
 * @param {Number} value The value to clamp.
 * @param {Number} min The minimum value.
 * @param {Number} max The maximum value.
 * @returns {Number} The clamped value such that min <= result <= max.
 */
MMath.clamp = function(value, min, max) {
  return Math.max(min, Math.min(max, value));
};

export default MMath;
