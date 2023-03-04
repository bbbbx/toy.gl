import Matrix4 from "./Matrix4";
import Plane from "./Plane";

interface Frustum {
  projectionMatrix: Matrix4;
  inverseProjectionMatrix: Matrix4;
  update();
}

export default Frustum;
