import defined from "./defined";

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
}

export default Color;
