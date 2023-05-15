import Cartesian3 from "../math/Cartesian3";
import Cartesian4 from "../math/Cartesian4";
import Plane from "../math/Plane";
import BoundingVolume from "./BoundingVolume";
import Intersect from "./Intersect";

const scratchPlane = new Plane(new Cartesian3(1.0, 0.0, 0.0), 0.0);

/**
 * The culling volume defined by planes.
 */
class CullingVolume {
  planes: Cartesian4[]

  constructor(planes: Cartesian4[] = []) {
    this.planes = planes;
  }

  computeVisibility(boundingVolume: BoundingVolume) : Intersect {
    const planes = this.planes;
    let intersecting = false;
    for (let i = 0; i < planes.length; i++) {
      const plane = planes[i];
      const result = boundingVolume.intersectPlane(Plane.fromCartesian4(plane, scratchPlane));

      if (result === Intersect.OUTSIDE) {
        return Intersect.OUTSIDE;
      } else if (result === Intersect.INTERSECTING) {
        intersecting = true;
      }
    }

    return intersecting ? Intersect.INTERSECTING : Intersect.INSIDE;
  }
}

export default CullingVolume;
