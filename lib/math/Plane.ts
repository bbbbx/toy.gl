import Cartesian3 from "./Cartesian3";
import Cartesian4 from "./Cartesian4";

const scratchNormal = new Cartesian3()

class Plane {
  normal: Cartesian3;
  distance: number;

  constructor(normal: Cartesian3, distance: number) {
    this.normal = normal;
    this.distance = distance;
  }

  static fromCartesian4(coefficients: Cartesian4, result = new Plane(new Cartesian3(1.0, 0.0, 0.0), 0.0)) : Plane {
    const normal = Cartesian3.fromCartesian4(coefficients, scratchNormal);
    const distance = coefficients.w;

    Cartesian3.clone(normal, result.normal);
    result.distance = distance;

    return result;
  }
}

export default Plane;
