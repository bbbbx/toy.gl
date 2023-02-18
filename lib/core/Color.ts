import defined from "./defined";

/**
 * @public
 */
class Color {
  red: number;
  green: number;
  blue: number;
  alpha: number;

  constructor(red = 1.0, green = 1.0, blue = 1.0, alpha = 1.0) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.alpha = alpha;
  }

  static equals(left: Color, right: Color) {
    return (
      left === right || //
      (defined(left) && //
        defined(right) && //
        left.red === right.red && //
        left.green === right.green && //
        left.blue === right.blue && //
        left.alpha === right.alpha)
    );
  }

  static clone(color: Color, result = new Color()) {
    result.red = color.red;
    result.green = color.green;
    result.blue = color.blue;
    result.alpha = color.alpha;
    return result;
  }

  static equalsArray(color: Color, array: number[], offset: number) : boolean {
    return (
      color.red === array[offset] &&
      color.green === array[offset + 1] &&
      color.blue === array[offset + 2] &&
      color.alpha === array[offset + 3]
    );
  }

  static pack(value: Color, array: number[], startingIndex = 0) {
    array[startingIndex + 0] = value.red;
    array[startingIndex + 1] = value.green;
    array[startingIndex + 2] = value.blue;
    array[startingIndex + 3] = value.alpha;

    return array;
  }
}

export default Color;
