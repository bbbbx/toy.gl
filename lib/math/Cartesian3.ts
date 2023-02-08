import defined from "../core/defined";

class Cartesian3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0.0, y = 0.0, z = 0.0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Computes the provided Cartesian's squared magnitude.
   *
   * @param {Cartesian3} cartesian The Cartesian instance whose squared magnitude is to be computed.
   * @returns {Number} The squared magnitude.
   */
  static magnitudeSquared(cartesian: Cartesian3): number {
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
  static magnitude(cartesian: Cartesian3): number {
    return Math.sqrt(Cartesian3.magnitudeSquared(cartesian));
  };


  /**
   * Computes the normalized form of the supplied Cartesian.
   *
   * @param {Cartesian3} cartesian The Cartesian to be normalized.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static normalize(cartesian: Cartesian3, result: Cartesian3 = new Cartesian3()) {
    const magnitude = Cartesian3.magnitude(cartesian);

    result.x = cartesian.x / magnitude;
    result.y = cartesian.y / magnitude;
    result.z = cartesian.z / magnitude;

    if (isNaN(result.x) || isNaN(result.y) || isNaN(result.z)) {
      throw new Error('normalized result is not a number');
    }

    return result;
  };


  static dot(left: Cartesian3, right: Cartesian3): number {
    return left.x * right.x
      + left.y * right.y
      + left.z * right.z;
  }

  /**
   * Multiplies the provided Cartesian componentwise by the provided scalar.
   *
   * @param {Cartesian3} cartesian The Cartesian to be scaled.
   * @param {Number} scalar The scalar to multiply with.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The modified result parameter.
   */
  static multiplyByScalar(cartesian: Cartesian3, scalar: number, result: Cartesian3 = new Cartesian3()) {
    result.x = cartesian.x * scalar;
    result.y = cartesian.y * scalar;
    result.z = cartesian.z * scalar;
    return result;
  }

  /**
   * Computes the cross (outer) product of two Cartesians.
   *
   * @param {Cartesian3} left The first Cartesian.
   * @param {Cartesian3} right The second Cartesian.
   * @param {Cartesian3} [result] The object onto which to store the result.
   * @returns {Cartesian3} The cross product.
   */
  static cross(left: Cartesian3, right: Cartesian3, result: Cartesian3 = new Cartesian3()): Cartesian3 {
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

  static equals(left: Cartesian3, right: Cartesian3) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left.x === right.x &&
        left.y === right.y &&
        left.z === right.z)
    );
  }

  static clone(cartesian: Cartesian3, result?: Cartesian3): Cartesian3 {
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
  }
}

export default Cartesian3;
