import Frustum from "../math/Frustum";
import Matrix3 from "../math/Matrix3";
import Matrix4 from "../math/Matrix4";
import Camera from "../scene/Camera";
import FrameState from "../scene/FrameState";
import Pass from "./Pass";

class UniformState {
  _model: Matrix4;
  _view: Matrix4;
  _inverseView: Matrix4;
  _projection: Matrix4;

  _frameState: FrameState;
  _pass: Pass;

  // Derived members
  _inverseModel: Matrix4;
  _inverseModelDirty: boolean;

  _modelView: Matrix4;
  _modelViewDirty: boolean;

  _inverseModelView: Matrix4;
  _inverseModelViewDirty: boolean;

  _viewProjection: Matrix4;
  _viewProjectionDirty: boolean;

  _modelViewProjection: Matrix4;
  _modelViewProjectionDirty: boolean;

  _normal: Matrix4;
  _normalDirty: boolean;

  constructor() {
    this._model = Matrix4.clone(Matrix4.IDENTITY);
    this._view = Matrix4.clone(Matrix4.IDENTITY);
    this._inverseView = Matrix4.clone(Matrix4.IDENTITY);
    this._projection = Matrix4.clone(Matrix4.IDENTITY);

    this._inverseModel = new Matrix4();
    this._inverseModelDirty = true;

    this._modelView = new Matrix4();
    this._modelViewDirty = true;

    this._inverseModelView = new Matrix4();
    this._inverseModelViewDirty = true;

    this._viewProjection = new Matrix4();
    this._viewProjectionDirty = true;

    this._modelViewProjection = new Matrix4();
    this._modelViewProjectionDirty = true;

    this._normal = new Matrix4();
    this._normalDirty = true;
  }

  updateCamera(camera: Camera) {
    setView(this, camera.viewMatrix);
    setInverseView(this, camera.inverseViewMatrix);
    // setCamera(this, camera);

    this.updateFrustum(camera.frustum);
  }

  updateFrustum(frustum: Frustum) {
    setProjection(this, frustum.projectionMatrix);
  }

  updatePass(pass: Pass) {
    this._pass = pass;
  }

  update(frameState: FrameState) {
    const camera = frameState.camera;
    this.updateCamera(camera);
  }

  public get model() { return this._model; }
  public set model(matrix: Matrix4) {
    Matrix4.clone(matrix, this._model);

    this._inverseModelDirty = true;
    this._modelViewDirty = true;
    this._inverseModelViewDirty = true;
    this._modelViewProjectionDirty = true;
    this._normalDirty = true;
  }

  public get inverseModel() {
    if (this._inverseModelDirty) {
      this._inverseModelDirty = false;

      Matrix4.inverse(this._model, this._inverseModel);
    }
    return this._inverseModel;
  }

  public get modelView() {
    cleanModelView(this);
    return this._modelView;
  }

  public get inverseModelView() {
    cleanInverseModelView(this);
    return this._inverseModelView;
  }

  public get viewProjection() {
    cleanViewProjection(this);
    return this._viewProjection;
  }

  public get projection() {
    return this._projection;
  }

  public get normal() {
    cleanNormal(this);
    return this._normal;
  }

}

function setView(uniformState: UniformState, view: Matrix4) {
  Matrix4.clone(view, uniformState._view);

  uniformState._normalDirty = true;
  uniformState._modelViewDirty = true;
  uniformState._inverseModelViewDirty = true;
  uniformState._viewProjectionDirty = true;
  uniformState._modelViewProjectionDirty = true;
}

function setInverseView(uniformState: UniformState, inverseView: Matrix4) {
  Matrix4.clone(inverseView, uniformState._inverseView);
}

function setProjection(uniformState: UniformState, projection: Matrix4) {
  Matrix4.clone(projection, uniformState._projection);

  uniformState._viewProjectionDirty = true;
  uniformState._modelViewProjectionDirty = true;
}

function cleanModelView(uniformState: UniformState) {
  if (uniformState._modelViewDirty) {
    uniformState._modelViewDirty = false;

    Matrix4.multiplyTransformation(
      uniformState._view,
      uniformState._model,
      uniformState._modelView
    );
  }
}

function cleanInverseModelView(uniformState: UniformState) {
  if (uniformState._inverseModelViewDirty) {
    uniformState._inverseModelViewDirty = false;

    Matrix4.inverse(
      uniformState.modelView,
      uniformState._inverseModelView
    );
  }
}

function cleanViewProjection(uniformState: UniformState) {
  if (uniformState._viewProjectionDirty) {
    uniformState._viewProjectionDirty = false;

    Matrix4.multiply(
      uniformState._projection,
      uniformState._view,
      uniformState._viewProjection
    );
  }
}

function cleanNormal(uniformState: UniformState) {
  if (uniformState._normalDirty) {
    uniformState._normalDirty = false;

    const normalMatrix = uniformState._normal;
    Matrix4.getMatrix3(uniformState.inverseModelView, normalMatrix);
    Matrix3.getRotation(normalMatrix, normalMatrix);
    Matrix3.transpose(normalMatrix, normalMatrix);
  }
}

export default UniformState;
