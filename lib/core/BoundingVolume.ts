import Cartesian3 from "../math/Cartesian3";
import Plane from "../math/Plane";
import Intersect from "./Intersect";
import Interval from "./Interval";

abstract class BoundingVolume {
  abstract intersectPlane(plane: Plane): Intersect
  // isOccluded: (occluder) => boolean;
  abstract computePlaneDistances(position: Cartesian3, direction: Cartesian3, result?: Interval): Interval
}

export default BoundingVolume;
