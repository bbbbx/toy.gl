import Frustum from "./Frustum";
import Matrix4 from "./Matrix4";

/**
 * @public
 */
class PerspectiveFrustum implements Frustum {
  projectionMatrix: Matrix4 = Matrix4.clone(Matrix4.IDENTITY);
  inverseProjectionMatrix: Matrix4 = Matrix4.clone(Matrix4.IDENTITY);

  private _fov: number;
  private _fovY: number;
  private _aspectRatio: number;
  private _near: number;
  private _far: number;

  fov: number;
  aspectRatio: number;
  near: number;
  far: number;

  constructor(
    fov?: number,
    aspectRatio?: number,
    near: number = 0.1,
    far: number = 1e9
  ) {
    this.fov = fov;
    this.aspectRatio = aspectRatio;
    this.near = near;
    this.far = far;

    this._near = near;
    this._far = far;
  }

  update() {
    if (
      this.fov !== this._fov ||
      this.aspectRatio !== this._aspectRatio ||
      this.near !== this._near ||
      this.far !== this._far
    ) {
      this._fov = this.fov;
      this._aspectRatio = this.aspectRatio;
      this._near = this.near;
      this._far = this.far;

      this._fovY = this.aspectRatio <= 1.0 ? this.fov : Math.atan(Math.tan(this.fov * 0.5) / this.aspectRatio) * 2.0;

      Matrix4.computePerspectiveFieldOfView(this._fovY, this._aspectRatio, this._near, this._far, this.projectionMatrix);
      Matrix4.inverse(this.projectionMatrix, this.inverseProjectionMatrix);
    }
  }
}

export default PerspectiveFrustum;
