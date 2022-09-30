import Cartesian3 from './Cartesian3.js';
import defaultValue from '../defaultValue.js';
import defined from '../defined.js';

/**
 * A set of 4-dimensional coordinates used to represent rotation in 3-dimensional space.
 * @alias Quaternion
 * @constructor
 *
 * @param {Number} [x=0.0] The X component.
 * @param {Number} [y=0.0] The Y component.
 * @param {Number} [z=0.0] The Z component.
 * @param {Number} [w=0.0] The W component.
 *
 * @see PackableForInterpolation
 */
function Quaternion(x, y, z, w) {
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

const fromAxisAngleScratch = new Cartesian3();
/**
 * Computes a quaternion representing a rotation around an axis.
 *
 * @param {Cartesian3} axis The axis of rotation.
 * @param {Number} angle The angle in radians to rotate around the axis.
 * @param {Quaternion} [result] The object onto which to store the result.
 * @returns {Quaternion} The modified result parameter or a new Quaternion instance if one was not provided.
 */
Quaternion.fromAxisAngle = function(axis, angle, result) {
  const halfAngle = angle / 2.0;
  const s = Math.sin(halfAngle);

  Cartesian3.normalize(axis, fromAxisAngleScratch);

  const x = fromAxisAngleScratch.x * s;
  const y = fromAxisAngleScratch.y * s;
  const z = fromAxisAngleScratch.z * s;
  const w = Math.cos(halfAngle);

  if (!defined(result)) {
    return new Quaternion(x, y, z, w);
  }

  result.x = x;
  result.y = y;
  result.z = z;
  result.w = w;
  return result
};

/**
 * Returns a string representing this quaternion in the format (x, y, z, w).
 *
 * @returns {String} A string representing this Quaternion.
 */
Quaternion.prototype.toString = function () {
  return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
};

export default Quaternion;