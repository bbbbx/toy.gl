import Cartesian3 from "../math/Cartesian3";
import Matrix4 from "../math/Matrix4";
import PerspectiveFrustum from "../math/PerspectiveFrustum";

const scratchTarget = new Cartesian3();
const scratchPosition = new Cartesian3();
const scratchMatrix = new Matrix4();

/**
 * @public
 */
class Camera {
  position: Cartesian3 = new Cartesian3();
  direction: Cartesian3 = new Cartesian3();
  up: Cartesian3 = new Cartesian3();
  right: Cartesian3 = new Cartesian3();

  upAxis = new Cartesian3(0, 1, 0);

  viewMatrix: Matrix4 = Matrix4.clone(Matrix4.IDENTITY);
  inverseViewMatrix: Matrix4 = Matrix4.clone(Matrix4.IDENTITY);;
  viewProjectionMatrix: Matrix4 = Matrix4.clone(Matrix4.IDENTITY);;

  frustum: PerspectiveFrustum = new PerspectiveFrustum();

  constructor() {
  }

  lookAt(x: Cartesian3 | number, y?: number, z?: number) {
    if (x instanceof Cartesian3) {
      Cartesian3.clone(x, scratchTarget);
    } else {
      scratchTarget.set(x, y, z);
    }

    Matrix4.lookAt(this.position, scratchTarget, this.upAxis, scratchMatrix);

    // set rotateMatrix from scratchMatrix
    Matrix4.getColumn<Cartesian3>(scratchMatrix, 0, this.right);
    Matrix4.getColumn<Cartesian3>(scratchMatrix, 1, this.direction);
    Matrix4.getColumn<Cartesian3>(scratchMatrix, 2, this.up);
  }

  /**
   * Update view matrix, inverse view matrix, projection matrix and inverse projection matrix.
   */
  update() {
    Matrix4.computeView(this.position, this.direction, this.up, this.right, this.viewMatrix);
    Matrix4.inverse(this.viewMatrix, this.inverseViewMatrix);

    this.frustum.update();

    Matrix4.multiply(this.frustum.projectionMatrix, this.viewMatrix, this.viewProjectionMatrix);
  }
}

export default Camera;
