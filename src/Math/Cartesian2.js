import defaultValue from '../defaultValue.js';
import defined from '../defined.js';
import MMath from './Math.js';

/**
 * A 2D Cartesian point.
 * @alias Cartesian2
 * @constructor
 *
 * @param {Number} [x=0.0] The X component.
 * @param {Number} [y=0.0] The Y component.
 */
function Cartesian2(x, y) {
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
}

Object.defineProperties(Cartesian2.prototype, {
  length: {
    get: function() {
      return 2;
    },
  },
  0: {
    get: function() {
      return this.x;
    },
  },
  1: {
    get: function() {
      return this.y;
    },
  },
});


/**
 * Creates a Cartesian2 instance from x and y coordinates.
 *
 * @param {Number} x The x coordinate.
 * @param {Number} y The y coordinate.
 * @param {Cartesian2} [result] The object onto which to store the result.
 * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
 */
Cartesian2.fromElements = function (x, y, result) {
  if (!defined(result)) {
    return new Cartesian2(x, y);
  }

  result.x = x;
  result.y = y;
  return result;
};


/**
 * Duplicates a Cartesian2 instance.
 *
 * @param {Cartesian2} cartesian The Cartesian to duplicate.
 * @param {Cartesian2} [result] The object onto which to store the result.
 * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided. (Returns undefined if cartesian is undefined)
 */
Cartesian2.clone = function (cartesian, result) {
  if (!defined(cartesian)) {
    return undefined;
  }
  if (!defined(result)) {
    return new Cartesian2(cartesian.x, cartesian.y);
  }

  result.x = cartesian.x;
  result.y = cartesian.y;
  return result;
};


/**
 * Compares the provided Cartesians componentwise and returns
 * <code>true</code> if they are equal, <code>false</code> otherwise.
 *
 * @param {Cartesian2} [left] The first Cartesian.
 * @param {Cartesian2} [right] The second Cartesian.
 * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
 */
Cartesian2.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.x === right.x &&
      left.y === right.y)
  );
};


/**
 * Creates a Cartesian2 instance from an existing Cartesian3.  This simply takes the
 * x and y properties of the Cartesian3 and drops z.
 * @function
 *
 * @param {Cartesian3} cartesian The Cartesian3 instance to create a Cartesian2 instance from.
 * @param {Cartesian2} [result] The object onto which to store the result.
 * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
 */
Cartesian2.fromCartesian3 = Cartesian2.clone;


/**
 * Creates a Cartesian2 instance from an existing Cartesian4.  This simply takes the
 * x and y properties of the Cartesian4 and drops z and w.
 * @function
 *
 * @param {Cartesian4} cartesian The Cartesian4 instance to create a Cartesian2 instance from.
 * @param {Cartesian2} [result] The object onto which to store the result.
 * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
 */
Cartesian2.fromCartesian4 = Cartesian2.clone;


/**
 * Constrain a value to lie between two values.
 *
 * @param {Cartesian2} value The value to clamp.
 * @param {Cartesian2} min The minimum bound.
 * @param {Cartesian2} max The maximum bound.
 * @param {Cartesian2} result The object into which to store the result.
 * @returns {Cartesian2} The clamped value such that min <= result <= max.
 */
Cartesian2.clamp = function (value, min, max, result) {
  const x = MMath.clamp(value.x, min.x, max.x);
  const y = MMath.clamp(value.y, min.y, max.y);

  result.x = x;
  result.y = y;

  return result;
};


/**
 * Computes the provided Cartesian's squared magnitude.
 *
 * @param {Cartesian2} cartesian The Cartesian instance whose squared magnitude is to be computed.
 * @returns {Number} The squared magnitude.
 */
Cartesian2.magnitudeSquared = function (cartesian) {
  return cartesian.x * cartesian.x + cartesian.y * cartesian.y;
};

/**
 * An immutable Cartesian2 instance initialized to (0.0, 0.0).
 *
 * @type {Cartesian2}
 * @constant
 */
Cartesian2.ZERO = Object.freeze(new Cartesian2(0.0, 0.0, 0.0));


/**
 * Computes the Cartesian's magnitude (length).
 *
 * @param {Cartesian2} cartesian The Cartesian instance whose magnitude is to be computed.
 * @returns {Number} The magnitude.
 */
Cartesian2.magnitude = function (cartesian) {
  return Math.sqrt(Cartesian2.magnitudeSquared(cartesian));
};

/**
 * Computes the normalized form of the supplied Cartesian.
 *
 * @param {Cartesian2} cartesian The Cartesian to be normalized.
 * @param {Cartesian2} result The object onto which to store the result.
 * @returns {Cartesian2} The modified result parameter.
 */
Cartesian2.normalize = function (cartesian, result) {
  const magnitude = Cartesian2.magnitude(cartesian);

  result.x = cartesian.x / magnitude;
  result.y = cartesian.y / magnitude;

  if (isNaN(result.x) || isNaN(result.y)) {
    throw new Error('normalized result is not a number');
  }

  return result;
};

/**
 * Computes the dot (scalar) product of two Cartesians.
 *
 * @param {Cartesian2} left The first Cartesian.
 * @param {Cartesian2} right The second Cartesian.
 * @returns {Number} The dot product.
 */
Cartesian2.dot = function (left, right) {
  return left.x * right.x + left.y * right.y;
};

/**
 * Computes the magnitude of the cross product that would result from implicitly setting the Z coordinate of the input vectors to 0
 *
 * @param {Cartesian2} left The first Cartesian.
 * @param {Cartesian2} right The second Cartesian.
 * @returns {Number} The cross product.
 */
Cartesian2.cross = function (left, right) {
  return left.x * right.y - left.y * right.x;
};

/**
 * Computes the componentwise sum of two Cartesians.
 *
 * @param {Cartesian2} left The first Cartesian.
 * @param {Cartesian2} right The second Cartesian.
 * @param {Cartesian2} result The object onto which to store the result.
 * @returns {Cartesian2} The modified result parameter.
 */
Cartesian2.add = function (left, right, result) {
  result.x = left.x + right.x;
  result.y = left.y + right.y;
  return result;
};

/**
 * Computes the componentwise difference of two Cartesians.
 *
 * @param {Cartesian2} left The first Cartesian.
 * @param {Cartesian2} right The second Cartesian.
 * @param {Cartesian2} result The object onto which to store the result.
 * @returns {Cartesian2} The modified result parameter.
 */
Cartesian2.subtract = function (left, right, result) {
  result.x = left.x - right.x;
  result.y = left.y - right.y;
  return result;
};

/**
 * Multiplies the provided Cartesian componentwise by the provided scalar.
 *
 * @param {Cartesian2} cartesian The Cartesian to be scaled.
 * @param {Number} scalar The scalar to multiply with.
 * @param {Cartesian2} result The object onto which to store the result.
 * @returns {Cartesian2} The modified result parameter.
 */
Cartesian2.multiplyByScalar = function (cartesian, scalar, result) {
  result.x = cartesian.x * scalar;
  result.y = cartesian.y * scalar;
  return result;
};


/**
 * Divides the provided Cartesian componentwise by the provided scalar.
 *
 * @param {Cartesian2} cartesian The Cartesian to be divided.
 * @param {Number} scalar The scalar to divide by.
 * @param {Cartesian2} result The object onto which to store the result.
 * @returns {Cartesian2} The modified result parameter.
 */
Cartesian2.divideByScalar = function (cartesian, scalar, result) {
  result.x = cartesian.x / scalar;
  result.y = cartesian.y / scalar;
  return result;
};

/**
 * Negates the provided Cartesian.
 *
 * @param {Cartesian2} cartesian The Cartesian to be negated.
 * @param {Cartesian2} result The object onto which to store the result.
 * @returns {Cartesian2} The modified result parameter.
 */
Cartesian2.negate = function (cartesian, result) {
  result.x = -cartesian.x;
  result.y = -cartesian.y;
  return result;
};

/**
  * An immutable Cartesian2 instance initialized to (1.0, 1.0).
  *
  * @type {Cartesian2}
  * @constant
  */
Cartesian2.ONE = Object.freeze(new Cartesian2(1.0, 1.0));
 
/**
  * An immutable Cartesian2 instance initialized to (1.0, 0.0).
  *
  * @type {Cartesian2}
  * @constant
  */
Cartesian2.UNIT_X = Object.freeze(new Cartesian2(1.0, 0.0));
 
/**
  * An immutable Cartesian2 instance initialized to (0.0, 1.0).
  *
  * @type {Cartesian2}
  * @constant
  */
Cartesian2.UNIT_Y = Object.freeze(new Cartesian2(0.0, 1.0));

/**
 * Duplicates this Cartesian2 instance.
 *
 * @param {Cartesian2} [result] The object onto which to store the result.
 * @returns {Cartesian2} The modified result parameter or a new Cartesian2 instance if one was not provided.
 */
Cartesian2.prototype.clone = function (result) {
  return Cartesian2.clone(this, result);
};

/**
 * Normalize this 2-dimensions vector.
 *
 * @returns {Cartesian2} this object.
 */
Cartesian2.prototype.normalize = function() {
  return Cartesian2.normalize(this, this);
};

/**
 * Creates a string representing this Cartesian in the format '(x, y)'.
 *
 * @returns {String} A string representing the provided Cartesian in the format '(x, y)'.
 */
Cartesian2.prototype.toString = function () {
  return `(${this.x}, ${this.y})`;
};

export default Cartesian2;
