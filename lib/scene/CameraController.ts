import Camera from "./Camera";

/**
 * @public
 */
abstract class CameraController {
  camera: Camera;
  domElement:  HTMLElement;

  constructor(camera: Camera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
  }

  abstract update();
}

export default CameraController;
