import defined from "../core/defined";

class Cartesian2 {
  x: number;
  y: number;

  constructor(x = 0.0, y = 0.0) {
    this.x = x;
    this.y = y;
  }

  static equals(left: Cartesian2, right: Cartesian2) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left.x === right.x &&
        left.y === right.y)
    );
  }

  static clone(cartesian: Cartesian2, result: Cartesian2) {
    if (!defined(cartesian)) {
      return undefined;
    }
    if (!defined(result)) {
      return new Cartesian2(cartesian.x, cartesian.y);
    }

    result.x = cartesian.x;
    result.y = cartesian.y;
    return result;
  }
}

export default Cartesian2;