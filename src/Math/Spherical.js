import defaultValue from '../defaultValue.js';
import defined from '../defined.js';

/**
 * Spherical coordinates (r, θ, φ) as commonly used in physics (ISO 80000-2:2019 convention),
 * see [https://en.wikipedia.org/wiki/Spherical_coordinate_system](https://en.wikipedia.org/wiki/Spherical_coordinate_system).
 * ![https://upload.wikimedia.org/wikipedia/commons/4/4f/3D_Spherical.svg](https://upload.wikimedia.org/wikipedia/commons/4/4f/3D_Spherical.svg)
 * @constructor
 *
 * @param {Number} [phi=0] azimuthal angle φ (phi) (angle of rotation from the initial meridian plane).
 * @param {Number} [theta=0] polar angle θ (theta) (angle with respect to polar axis).
 * @param {Number} [radius=1] radial distance r (distance to origin).
 */
function Spherical(phi, theta, radius) {
  /**
   * The phi component.
   * @type {Number}
   * @default 0.0
   */
  this.phi = defaultValue(phi, 0);
  /**
   * The theta component.
   * @type {Number}
   * @default 0.0
   */
  this.theta = defaultValue(theta, 0);
  /**
   * The radius component.
   * @type {Number}
   * @default 1.0
   */
  this.radius = defaultValue(radius, 1);
}

Spherical.fromCartesian3 = function(cartesian3, result) {
  if (!defined(result)) {
    result = new Spherical();
  }

  const x = cartesian3.x;
  const y = cartesian3.y;
  const z = cartesian3.z;
  const radialSquared = x * x + y * y;

  result.phi = Math.atan2(y, x);
  result.theta = Math.atan2(Math.sqrt(radialSquared), z);
  result.radius = Math.sqrt(radialSquared + z * z);

  return result;
};


/**
 * Creates a duplicate of a Spherical.
 *
 * @param {Spherical} spherical The spherical to clone.
 * @param {Spherical} [result] The object to store the result into, if undefined a new instance will be created.
 * @returns {Spherical} The modified result parameter or a new instance if result was undefined. (Returns undefined if spherical is undefined)
 */
Spherical.clone = function (spherical, result) {
  if (!defined(spherical)) {
    return undefined;
  }

  if (!defined(result)) {
    return new Spherical(spherical.phi, spherical.theta, spherical.radius);
  }

  result.phi = spherical.phi;
  result.theta = spherical.theta;
  result.radius = spherical.radius;

  return result;
};


/**
 * Computes the normalized version of the provided spherical.
 *
 * @param {Spherical} spherical The spherical to be normalized.
 * @param {Spherical} [result] The object to store the result into, if undefined a new instance will be created.
 * @returns {Spherical} The modified result parameter or a new instance if result was undefined.
 */
Spherical.normalize = function (spherical, result) {
  if (!defined(result)) {
    return new Spherical(spherical.phi, spherical.theta, 1.0);
  }

  result.phi = spherical.phi;
  result.theta = spherical.theta;
  result.radius = 1.0;

  return result;
};

/**
 * Returns true if the first spherical is equal to the second spherical, false otherwise.
 *
 * @param {Spherical} left The first Spherical to be compared.
 * @param {Spherical} right The second Spherical to be compared.
 * @returns {Boolean} true if the first spherical is equal to the second spherical, false otherwise.
 */
Spherical.equals = function (left, right) {
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      left.phi === right.phi &&
      left.theta === right.theta &&
      left.radius === right.radius)
  );
};

/**
 * Returns true if the first spherical is within the provided epsilon of the second spherical, false otherwise.
 *
 * @param {Spherical} left The first Spherical to be compared.
 * @param {Spherical} right The second Spherical to be compared.
 * @param {Number} [epsilon=0.0] The epsilon to compare against.
 * @returns {Boolean} true if the first spherical is within the provided epsilon of the second spherical, false otherwise.
 */
Spherical.equalsEpsilon = function (left, right, epsilon) {
  epsilon = defaultValue(epsilon, 0.0);
  return (
    left === right ||
    (defined(left) &&
      defined(right) &&
      Math.abs(left.phi - right.phi) <= epsilon &&
      Math.abs(left.theta - right.theta) <= epsilon &&
      Math.abs(left.radius - right.radius) <= epsilon)
  );
};

/**
 * Returns a string representing this instance in the format (phi, theta, radius).
 *
 * @returns {String} A string representing this instance.
 */
Spherical.prototype.toString = function () {
  return `(${this.phi}, ${this.theta}, ${this.radius})`;
};

export default Spherical;
