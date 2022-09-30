import { Cartesian3 } from "../../dist/toygl.esm.js";
import defined from "../../src/defined.js";

/**
 * 
 * @param {HTMLCanvasElement} canvas 
 * @param {Camera} camera 
 */
function CameraController(canvas, camera) {
  this.canvas = canvas;
  this.camera = camera;

  this._isPointerUp = false;
  this._isPointerDown = false;

  this.speed = 33e3;
  this._velocity = new Cartesian3();
  this._isForward = false;
  this._isBack = false;
  this._isLeft = false;
  this._isRight = false;
  this._isUp = false;
  this._isDown = false;

  this._prevTime = undefined;

  this.canvas.addEventListener('pointerdown', () => {
    this._isPointerDown = true;
    this._isPointerUp = false;

    canvas.requestPointerLock();
  });
  this.canvas.addEventListener('pointerup', () => {
    this._isPointerUp = true;
    this._isPointerDown = false;

    document.exitPointerLock();

    this._isForward = false;
    this._isBack = false;
    this._isLeft = false;
    this._isRight = false;
    this._isUp = false;
    this._isDown = false;
  });
  this.canvas.addEventListener('mousemove', e => {
    if (this._isPointerDown) {
      const { movementX, movementY } = e;
      const camera = this.camera;

      // const up = Cartesian3.normalize(camera.position, new Cartesian3());
      camera.rotateRight(-movementX / 3 / 180 * Math.PI);
      camera.rotateDown(movementY /3 / 180 * Math.PI);
    }
  });

  this.canvas.tabIndex = 1000;
  this.canvas.style.outline = 'none';
  // this.canvas.focus();
  this.canvas.addEventListener('keydown', e => {
    if (!this._isPointerDown) {
      return;
    }

    switch (e.key) {
    case 'w':
      this._isForward = true;
      break;
    case 's':
      this._isBack = true;
      break;
    case 'a':
      this._isLeft = true;
      break;
    case 'd':
      this._isRight = true;
      break;
    case 'q':
      this._isDown = true;
      break;
    case 'e':
      this._isUp = true;
      break;
    }
  });
  this.canvas.addEventListener('keyup', e => {
    // if (!this._isPointerDown) {
    //   return;
    // }

    switch (e.key) {
    case 'w':
      this._isForward = false;
      break;
    case 's':
      this._isBack = false;
      break;
    case 'a':
      this._isLeft = false;
      break;
    case 'd':
      this._isRight = false;
      break;
    case 'q':
      this._isDown = false;
      break;
    case 'e':
      this._isUp = false;
      break;
    }
  });
}

CameraController.prototype.update = function(time) {
  if (!defined(this._prevTime)) {
    this._prevTime = time;
    return;
  }

  const deltaTime = time - this._prevTime;

  const camera = this.camera;

  const movementDirection = new Cartesian3(
    this._isForward - this._isBack,
    this._isRight - this._isLeft,
    this._isUp - this._isDown,
  );
  this._velocity.x = movementDirection.x * this.speed;
  this._velocity.y = movementDirection.y * this.speed;
  this._velocity.z = movementDirection.z * this.speed;

  const acceleration = new Cartesian3(
    -4 * this._velocity.x,
    -4 * this._velocity.y,
    -4 * this._velocity.z,
  );
  this._velocity.x += deltaTime * acceleration.x;
  this._velocity.y += deltaTime * acceleration.y;
  this._velocity.z += deltaTime * acceleration.z;

  const dx = this._velocity.x * deltaTime;
  const dy = this._velocity.y * deltaTime;
  const dz = this._velocity.z * deltaTime;
  camera.moveForward(dx);
  camera.moveRight(dy); 
  camera.moveUp(dz);
  // camera.position.x += dx;

  // camera.moveForward(dx);

  this._prevTime = time;
};

export default CameraController;
