// import { Cartesian2, Cartesian3, Matrix4 } from '../../../src';
import * as ToyGL from '../../../src/index.js';
const { Cartesian2, Cartesian3, Matrix4 } = ToyGL;

function ViewMatrices() {
  this.ProjectionMatrix = Matrix4.clone(Matrix4.IDENTITY);
  this.InvProjectionMatrix = Matrix4.clone(Matrix4.IDENTITY);
  this.ViewMatrix = Matrix4.clone(Matrix4.IDENTITY);
  this.InvViewMatrix = Matrix4.clone(Matrix4.IDENTITY);
  // WorldToClip : UE4 projection matrix projects such that clip space Z=1 is the near plane, and Z=0 is the infinite far plane. */
  this.ViewProjectionMatrix = Matrix4.clone(Matrix4.IDENTITY);
  this.InvViewProjectionMatrix = Matrix4.clone(Matrix4.IDENTITY);

  this.HMDViewMatrixNoRoll = Matrix4.clone(Matrix4.IDENTITY);
  this.TranslatedViewMatrix = Matrix4.clone(Matrix4.IDENTITY);
  this.TranslatedViewProjectionMatrix = Matrix4.clone(Matrix4.IDENTITY);
  this.InvTranslatedViewProjectionMatrix = Matrix4.clone(Matrix4.IDENTITY);

  this.PreViewTranslation = Cartesian3.clone(Cartesian3.ZERO);
  /** To support ortho and other modes this is redundant, in world space */
  this.ViewOrigin = Cartesian3.clone(Cartesian3.ZERO);
  /** Scale applied by the projection matrix in X and Y. */
  this.ProjectionScale = Cartesian2.clone(Cartesian2.ZERO);
  /** TemporalAA jitter offset currently stored in the projection matrix */
  this.TemporalAAProjectionJitter = Cartesian2.clone(Cartesian2.ZERO);

  /**
	 * Scale factor to use when computing the size of a sphere in pixels.
	 * 
	 * A common calculation is to determine the size of a sphere in pixels when projected on the screen:
	 *		ScreenRadius = max(0.5 * ViewSizeX * ProjMatrix[0][0], 0.5 * ViewSizeY * ProjMatrix[1][1]) * SphereRadius / ProjectedSpherePosition.W
	 * Instead you can now simply use:
	 *		ScreenRadius = ScreenScale * SphereRadius / ProjectedSpherePosition.W
	 */
  this.ScreenScale = 1.0;
}



ViewMatrices.prototype.GetViewMatrix = function() {
  return this.ViewMatrix;
};
ViewMatrices.prototype.GetInvViewMatrix = function() {
  return this.InvViewMatrix;
};

ViewMatrices.prototype.GetProjectionMatrix = function() {
  return this.ProjectionMatrix;
};
ViewMatrices.prototype.GetInvProjectionMatrix = function() {
  return this.InvProjectionMatrix;
};

ViewMatrices.prototype.GetViewOrigin = function() {
  return this.ViewOrigin;
};

ViewMatrices.prototype.GetViewProjectionMatrix = function() {
  return this.ViewProjectionMatrix;
};
ViewMatrices.prototype.GetInvViewProjectionMatrix = function() {
  return this.InvViewProjectionMatrix;
};

ViewMatrices.prototype.ComputeInvProjectionNoAAMatrix = function() {
  return Matrix4.inverse(this.ProjectionMatrix);
  // return InvertProjectionMatrix( ComputeProjectionNoAAMatrix() );
};

ViewMatrices.prototype.RecomputeDerivedMatrices = function() {
  // Compute the view projection matrix and its inverse.
  Matrix4.multiply(this.GetProjectionMatrix(), this.GetViewMatrix(), this.ViewProjectionMatrix);
  Matrix4.inverse(this.ViewMatrix, this.InvViewMatrix);
  Matrix4.inverse(this.ProjectionMatrix, this.InvProjectionMatrix);
  Matrix4.multiply(this.GetInvViewMatrix(), this.GetInvProjectionMatrix(), this.InvViewProjectionMatrix);
  Matrix4.getTranslation(this.GetInvViewMatrix(), this.ViewOrigin);

  // Compute a transform from view origin centered world-space to clip space.
  // TranslatedViewProjectionMatrix = GetTranslatedViewMatrix() * GetProjectionMatrix();
  // InvTranslatedViewProjectionMatrix = GetInvProjectionMatrix() * GetInvTranslatedViewMatrix();
};

export default ViewMatrices;
