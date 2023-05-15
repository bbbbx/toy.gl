import Cartesian3 from "../math/Cartesian3";
import Matrix4 from "../math/Matrix4";
import Plane from "../math/Plane";
import BoundingVolume from "./BoundingVolume";
import defaultValue from "./defaultValue";
import Intersect from "./Intersect";
import Interval from "./Interval";

const scratchCartesian3 = new Cartesian3();

class BoundingSphere implements BoundingVolume {
  center: Cartesian3;
  radius: number;

  constructor(center?: Cartesian3, radius?: number) {
    this.center = Cartesian3.clone(defaultValue(center, Cartesian3.ZERO));
    this.radius = defaultValue(radius, 0.0);
  }

  static intersectPlane(sphere: BoundingSphere, plane: Plane) : Intersect {
    const center = sphere.center;
    const radius = sphere.radius;
    const normal = plane.normal;
    const distanceToPlane = Cartesian3.dot(normal, center) + plane.distance;

    if (distanceToPlane < -radius) {
      // The center point is negative side of the plane normal
      return Intersect.OUTSIDE;
    } else if (distanceToPlane < radius) {
      // The center point is positive side of the plane, but radius extends beyond it; partial overlap
      return Intersect.INTERSECTING;
    }

    return Intersect.INSIDE;
  }

  intersectPlane(plane: Plane): Intersect {
    return BoundingSphere.intersectPlane(this, plane);
  }

  static computePlaneDistances(sphere: BoundingSphere, position: Cartesian3, direction: Cartesian3, result = new Interval()) {
    const toCenter = Cartesian3.subtract(
      sphere.center,
      position,
      scratchCartesian3
    );
    const mag = Cartesian3.dot(direction, toCenter);

    result.start = mag - sphere.radius;
    result.stop = mag + sphere.radius;

    return result;
  }

  computePlaneDistances(position: Cartesian3, direction: Cartesian3, result = new Interval()): Interval {
    throw BoundingSphere.computePlaneDistances(this, position, direction, result);
  }

  static clone(boundingSphere: BoundingSphere, result = new BoundingSphere()) {
    result.center = Cartesian3.clone(boundingSphere.center, result.center);
    result.radius = boundingSphere.radius;
    return result;
  }

  static fromCornerPoints(corner: Cartesian3, oppositeCorner: Cartesian3, result = new BoundingSphere()) {
    const center = Cartesian3.midpoint(corner, oppositeCorner, result.center);
    result.radius = Cartesian3.distance(center, oppositeCorner);
    return result;
  }

  static transformWithoutScale(boundingSphere: BoundingSphere, transform: Matrix4, result = new BoundingSphere) {
    Matrix4.multiplyByPoint(transform, boundingSphere.center, result.center);
    result.radius = boundingSphere.radius;
    return result;
  }

  static transform(boundingSphere: BoundingSphere, transform: Matrix4, result = new BoundingSphere) {
    Matrix4.multiplyByPoint(transform, boundingSphere.center, result.center);
    result.radius = Matrix4.getMaximumScale(transform) * boundingSphere.radius;
    return result;
  }

}

export default BoundingSphere;
