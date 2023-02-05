import defined from "../core/defined";

class Cartesian4 {
  x: number;
  y: number;
  z: number;
  w: number;

  constructor(x = 0.0, y = 0.0, z = 0.0, w = 0.0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  static multiplyByUniformScale(cartesian: Cartesian4, scalar: number, result: Cartesian4 = new Cartesian4()): Cartesian4 {
    result.x = cartesian.x * scalar;
    result.y = cartesian.y * scalar;
    result.z = cartesian.z * scalar;
    result.w = cartesian.w * scalar;
    return result;
  }

  static equals(left: Cartesian4, right: Cartesian4) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left.x === right.x &&
        left.y === right.y &&
        left.z === right.z &&
        left.w === right.w)
    );
  }

  static clone(cartesian: Cartesian4, result: Cartesian4) {
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
  }
}

export default Cartesian4;
