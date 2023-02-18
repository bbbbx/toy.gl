import defined from "../core/defined";

/**
 * @public
 */
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

  static equalsArray(cartesian: Cartesian4, array: number[], offset: number) : boolean {
    return (
      cartesian.x === array[offset] &&
      cartesian.y === array[offset + 1] &&
      cartesian.z === array[offset + 2] &&
      cartesian.w === array[offset + 3]
    );
  }

  static pack(value: Cartesian4, array: number[], startingIndex = 0) : number[] {
    array[startingIndex + 0] = value.x;
    array[startingIndex + 1] = value.y;
    array[startingIndex + 2] = value.z;
    array[startingIndex + 3] = value.w;

    return array;
  }
}

export default Cartesian4;
