import defined from "../core/defined";
import Cartesian4 from "./Cartesian4";
import Quaternion from "./Quaternion";
import Spherical from "./Spherical";

/**
 * @public
 */
class Cartesian3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0.0, y = 0.0, z = 0.0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static ZERO = Object.freeze(new Cartesian3(0.0, 0.0, 0.0));
  static ONE = Object.freeze(new Cartesian3(1.0, 1.0, 1.0));

  /**
   * Computes the provided Cartesian's squared magnitude.
   *
   * @param cartesian - The Cartesian instance whose squared magnitude is to be computed.
   * @returns The squared magnitude.
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
   * @param cartesian - The Cartesian instance whose magnitude is to be computed.
   * @returns The magnitude.
   */
  static magnitude(cartesian: Cartesian3): number {
    return Math.sqrt(Cartesian3.magnitudeSquared(cartesian));
  };

  static midpoint(left: Cartesian3, right: Cartesian3, result = new Cartesian3()) {
    result.x = (left.x + right.x) * 0.5;
    result.y = (left.y + right.y) * 0.5;
    result.z = (left.z + right.z) * 0.5;
    return result;
  }

  static distance(left: Cartesian3, right: Cartesian3) {
    Cartesian3.subtract(left, right, distanceScratch);
    return Cartesian3.magnitude(distanceScratch)
  }

  /**
   * Computes the normalized form of the supplied Cartesian.
   *
   * @param cartesian - The Cartesian to be normalized.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
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
  }

  static add(left: Cartesian3, right: Cartesian3, result: Cartesian3 = new Cartesian3()) : Cartesian3 {
    result.x = left.x + right.x;
    result.y = left.y + right.y;
    result.z = left.z + right.z;

    return result;
  }

  static subtract(left: Cartesian3, right: Cartesian3, result: Cartesian3 = new Cartesian3()) : Cartesian3 {
    result.x = left.x - right.x;
    result.y = left.y - right.y;
    result.z = left.z - right.z;

    return result;
  }

  static dot(left: Cartesian3, right: Cartesian3): number {
    return left.x * right.x
      + left.y * right.y
      + left.z * right.z;
  }

  /**
   * Multiplies the provided Cartesian componentwise by the provided scalar.
   *
   * @param cartesian - The Cartesian to be scaled.
   * @param scalar - The scalar to multiply with.
   * @param result - The object onto which to store the result.
   * @returns The modified result parameter.
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
   * @param left - The first Cartesian.
   * @param right - The second Cartesian.
   * @param result - The object onto which to store the result.
   * @returns The cross product.
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

  static clone(cartesian: Readonly<Cartesian3>, result = new Cartesian3()) : Cartesian3 {
    result.x = cartesian.x;
    result.y = cartesian.y;
    result.z = cartesian.z;
    return result;
  }

  static equalsArray(cartesian: Cartesian3, array: number[], offset: number) : boolean {
    return (
      cartesian.x === array[offset] &&
      cartesian.y === array[offset + 1] &&
      cartesian.z === array[offset + 2]
    );
  }

  static pack(value: Cartesian3, array: number[], startingIndex = 0) {
    array[startingIndex + 0] = value.x;
    array[startingIndex + 1] = value.y;
    array[startingIndex + 2] = value.z;

    return array;
  }

  static unpack(array: ArrayLike<number>, startingIndex = 0, result = new Cartesian3): Cartesian3 {
    result.x = array[startingIndex + 0];
    result.y = array[startingIndex + 1];
    result.z = array[startingIndex + 2];

    return result;
  }

  static fromElements(x: number, y: number, z: number, result: Cartesian3 = new Cartesian3()) : Cartesian3 {
    result.x = x;
    result.y = y;
    result.z = z;
    return result;
  }

  static fromCartesian4(cartesian: Cartesian4, result = new Cartesian3()) : Cartesian3 {
    result.x = cartesian.x;
    result.y = cartesian.y;
    result.z = cartesian.z;
    return result;
  }

  static minimumByComponent(first: Cartesian3, second: Cartesian3, result = new Cartesian3()) {
    result.x = Math.min(first.x, second.x);
    result.y = Math.min(first.y, second.y);
    result.z = Math.min(first.z, second.z);
    return result;
  }

  static maximumByComponent(first: Cartesian3, second: Cartesian3, result = new Cartesian3()) {
    result.x = Math.max(first.x, second.x);
    result.y = Math.max(first.y, second.y);
    result.z = Math.max(first.z, second.z);
    return result;
  }

  static maximumComponent(cartesian: Cartesian3) {
    return Math.max(cartesian.x, cartesian.y, cartesian.z);
  }

  static minimumComponent(cartesian: Cartesian3) {
    return Math.min(cartesian.x, cartesian.y, cartesian.z);
  }

  public set(x: number | Cartesian3, y?: number, z?: number) : Cartesian3 {
    if (x instanceof Cartesian3) {
      return Cartesian3.fromElements(x.x, x.y, x.z, this);
    } else {
      return Cartesian3.fromElements(x, y, z, this);
    }
  }

  public applyQuaternion( q : Quaternion ) : Cartesian3 {
    const x = this.x, y = this.y, z = this.z;
    const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

    // calculate quat * vector

    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = - qx * x - qy * y - qz * z;

    // calculate result * inverse quat

    this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
    this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
    this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

    return this;
  }

  public setFromSphericalCoords(radius: number, phi: number, theta: number) : Cartesian3 {
    const sinPhiRadius = Math.sin( phi ) * radius;

    this.x = sinPhiRadius * Math.sin( theta );
    this.y = Math.cos( phi ) * radius;
    this.z = sinPhiRadius * Math.cos( theta );

    return this;
  }

  public setFromSpherical(s: Spherical) : Cartesian3 {
    return this.setFromSphericalCoords(s.radius, s.phi, s.theta);
  }
}

const distanceScratch = new Cartesian3();

export default Cartesian3;
