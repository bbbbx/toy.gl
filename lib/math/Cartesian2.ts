import defined from "../core/defined";

/**
 * @public
 */
class Cartesian2 {
  x: number;
  y: number;

  constructor(x = 0.0, y = 0.0) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number) : Cartesian2 {
    return Cartesian2.fromElements(x, y, this);
  }

  static ZERO = Object.freeze(new Cartesian2(0.0, 0.0));
  static ONE = Object.freeze(new Cartesian2(1.0, 1.0));

  static equals(left: Cartesian2, right: Cartesian2) {
    return (
      left === right ||
      (defined(left) &&
        defined(right) &&
        left.x === right.x &&
        left.y === right.y)
    );
  }

  static clone(cartesian: Readonly<Cartesian2>, result = new Cartesian2()) : Cartesian2 {
    result.x = cartesian.x;
    result.y = cartesian.y;
    return result;
  }

  static equalsArray(cartesian: Cartesian2, array: number[], offset: number) : boolean {
    return cartesian.x === array[offset] && cartesian.y === array[offset + 1];
  }

  /**
   * Stores the provided instance into the provided array.
   * @param value - The instance need to be packed
   * @param array - Pack into the array
   * @param startingIndex -
   * @returns 
   */
  static pack(value: Cartesian2, array: number[], startingIndex: number = 0) {
    array[startingIndex + 0] = value.x;
    array[startingIndex + 1] = value.y;

    return array;
  }

  static unpack(array: ArrayLike<number>, startingIndex: number = 0, result: Cartesian2 = new Cartesian2()) : Cartesian2 {
    result.x = array[startingIndex + 0];
    result.y = array[startingIndex + 1];

    return result;
  }

  static fromElements(x: number, y: number, result = new Cartesian2()): Cartesian2 {
    result.x = x;
    result.y = y;
    return result;
  }

  static subtract(left: Cartesian2, right: Cartesian2, result: Cartesian2) : Cartesian2 {
    result.x = left.x - right.x;
    result.y = left.y - right.y;
    return result;
  }

  static multiplyByScalar(cartesian: Cartesian2, scalar: number, result: Cartesian2) : Cartesian2 {
    result.x = cartesian.x * scalar;
    result.y = cartesian.y * scalar;
    return result;
  }
}

export default Cartesian2;
