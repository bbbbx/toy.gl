
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

/**
 * Returns a string representing this quaternion in the format (x, y, z, w).
 *
 * @returns {String} A string representing this Quaternion.
 */
 Quaternion.prototype.toString = function () {
  return `(${this.x}, ${this.y}, ${this.z}, ${this.w})`;
};

export default Quaternion;