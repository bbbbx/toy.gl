import CullingVolume from "../core/CullingVolume";
import Matrix4 from "./Matrix4";

interface Frustum {
  projectionMatrix: Matrix4;
  inverseProjectionMatrix: Matrix4;
  _cullingVolume : CullingVolume;

  update();
}

export default Frustum;
