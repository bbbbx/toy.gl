import { Cartesian3, Matrix3, Matrix4, Quaternion } from '../../dist/toygl.esm.js';
import defined from '../../src/defined.js';
import MMath from '../../src/Math/Math.js';

function Camera(options) {
  this.position = new Cartesian3();
  this._position = new Cartesian3();
  this.direction = Cartesian3.UNIT_Y.clone();
  this._direction = Cartesian3.UNIT_Y.clone();
  this.up = Cartesian3.UNIT_Z.clone();
  this._up = Cartesian3.UNIT_Z.clone();
  this.right = Cartesian3.UNIT_X.clone();
  this._right = Cartesian3.UNIT_X.clone();

  this._viewMatrix = Matrix4.computeView(this.position, this.direction, this.up, this.right, new Matrix4());
  this._cameraMatrix = Matrix4.inverse(this.viewMatrix, new Matrix4());

  const fovY = options.fovY;
  const aspectRatio = options.aspectRatio;
  const near = options.near;
  const far = options.far;
  this._far = far;

  this._projectionMatrix = Matrix4.computePerspectiveFieldOfView(fovY, aspectRatio, near, far, new Matrix4());

  this._viewProjectionMatrix = Matrix4.multiply(this._projectionMatrix, this._viewMatrix, new Matrix4());
  this._inverseViewProjectionMatrix = Matrix4.inverse(this._viewProjectionMatrix, new Matrix4());
}


function updateViewMatrix(camera) {
  Matrix4.computeView(
    camera._position,
    camera._direction,
    camera._up,
    camera._right,
    camera._viewMatrix
  );

  Matrix4.inverse(camera._viewMatrix, camera._cameraMatrix);
}

const scratchCartesian = new Cartesian3();
function updateMembers(camera) {
  const positionChanged = !Cartesian3.equals(camera.position, camera._position);
  if (positionChanged) {
    camera.position.clone(camera._position);
  }

  const directionChanged = !Cartesian3.equals(camera.direction, camera._direction);
  if (directionChanged) {
    camera.direction.clone(camera._direction);
  }

  const upChanged = !Cartesian3.equals(camera.up, camera._up);
  if (upChanged) {
    camera.up.clone(camera._up);
  }

  const rightChanged = !Cartesian3.equals(camera.right, camera._right);
  if (rightChanged) {
    camera.right.clone(camera._right);
  }

  if (directionChanged || upChanged || rightChanged) {
    const det = Cartesian3.dot(
      camera._direction,
      Cartesian3.cross(camera._up, camera._right, scratchCartesian)
    );
    if (!MMath.equalsEpsilon(det, 1.0, MMath.EPSILON2)) {
      //orthonormalize axes
      const invUpMag = 1.0 / Cartesian3.magnitudeSquared(camera._up);
      const scalar = Cartesian3.dot(camera._up, camera._direction) * invUpMag;
      const w0 = Cartesian3.multiplyByScalar(
        camera._direction,
        scalar,
        scratchCartesian
      );
      const up = Cartesian3.normalize(
        Cartesian3.subtract(camera._up, w0, camera._up),
        camera._up
      );
      Cartesian3.clone(up, camera.up);

      const right = Cartesian3.cross(camera._direction, up, camera._right);
      Cartesian3.clone(right, camera.right);
    }
  }

  if (
    positionChanged ||
    directionChanged ||
    upChanged ||
    rightChanged
  ) {
    updateViewMatrix(camera);

    Matrix4.multiply(camera._projectionMatrix, camera._viewMatrix, camera._viewProjectionMatrix);
    Matrix4.inverse(camera._viewProjectionMatrix, camera._inverseViewProjectionMatrix);
  }
}

Object.defineProperties(Camera.prototype, {
  viewMatrix: {
    get: function() {
      updateMembers(this);
      return this._viewMatrix;
    },
  },
  cameraMatrix: {
    get: function() {
      updateMembers(this);
      return this._cameraMatrix;
    },
  },
  projectionMatrix: {
    get: function() {
      updateMembers(this);
      return this._projectionMatrix;
    },
  },
  viewProjectionMatrix: {
    get: function() {
      updateMembers(this);
      return this._viewProjectionMatrix;
    },
  },
  inverseViewProjectionMatrix: {
    get: function() {
      updateMembers(this);
      return this._inverseViewProjectionMatrix;
    },
  },
});

const rotateScratchQuaternion = new Quaternion();
const rotateScratchMatrix = new Matrix3();
Camera.prototype.rotate = function(axis, angle) {
  const turnAngle = angle;
  const quaternion = Quaternion.fromAxisAngle(
    axis,
    -turnAngle,
    rotateScratchQuaternion
  );
  const rotation = Matrix3.fromQuaternion(quaternion, rotateScratchMatrix);
  // Matrix3.multiplyByVector(rotation, this.position, this.position);
  Matrix3.multiplyByVector(rotation, this.direction, this.direction);
  Matrix3.multiplyByVector(rotation, this.up, this.up);

  Cartesian3.cross(this.direction, this.up, this.right);
  Cartesian3.cross(this.right, this.direction, this.up);
};

function rotateHorizontal(camera, angle) {
  if (defined(camera.constrainedAxis)) {
    camera.rotate(camera.constrainedAxis, angle);
  } else {
    const up = Cartesian3.normalize(camera.position, new Cartesian3());
    camera.rotate(up, angle);
  }
}

function rotateVertical(camera, angle) {
  if (defined(camera.constrainedAxis)) {
    // TODO: ?
    // camera.rotate(camera.constrainedAxis, angle);
  } else {
    camera.rotate(camera.right, angle);
  }
}

Camera.prototype.rotateRight = function(angle) {
  rotateHorizontal(this, -angle);
};

Camera.prototype.rotateDown = function(angle) {
  rotateVertical(this, angle);
};

Camera.prototype.move = function(direction, distance) {
  const movement = Cartesian3.multiplyByScalar(direction, distance, new Cartesian3());
  Cartesian3.add(this.position, movement, this.position);
};

Camera.prototype.moveForward = function(distance) {
  this.move(this.direction, distance);
};
Camera.prototype.moveRight = function(distance) {
  this.move(this.right, distance);
};
Camera.prototype.moveUp = function(distance) {
  const upVector = Cartesian3.normalize(this.position, new Cartesian3());
  this.move(upVector, distance);
};

export default Camera;
