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

  static clone(cartesian: Cartesian3, result: Cartesian3) {
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
