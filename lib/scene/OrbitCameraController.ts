import Camera from "./Camera";
import Spherical from "../math/Spherical";
import Cartesian3 from "../math/Cartesian3";
import CameraController from "./CameraController";
import Cartesian2 from "../math/Cartesian2";
import Matrix4 from "../math/Matrix4";
import Quaternion from "../math/Quaternion";
import Matrix3 from "../math/Matrix3";
import MMath from "../math/Math";

enum MOUSE {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
  ROTATE = 0,
  DOLLY = 1,
  PAN = 2,
};

enum TOUCH {
  ROTATE = 0,
  PAN = 1,
  DOLLY_PAN = 2,
  DOLLY_ROTATE = 3,
};

enum STATE {
  NONE = -1,
  ROTATE = 0,
  DOLLY = 1,
  PAN = 2,
  TOUCH_ROTATE = 3,
  TOUCH_PAN = 4,
  TOUCH_DOLLY_PAN = 5,
  TOUCH_DOLLY_ROTATE = 6,
};

/**
 * @public
 */
class OrbitCameraController extends CameraController {
  update() {
    throw new Error("Method not implemented.");
  }

  static MOUSE = MOUSE;
  static TOUCH = TOUCH;

  enabled = true;
  target: Cartesian3;

  minDistance: number;
  maxDistance: number;

  minZoom: number;
  maxZoom: number;

  minPolarAngle: number;
  maxPolarAngle: number;
  minAzimuthAngle: number;
  maxAzimuthAngle: number;

  enableDamping: boolean;
  dampingFactor: number;

  enableZoom: boolean;
  zoomSpeed: number;

  enableRotate: boolean;
  rotateSpeed: number;

  enablePan: boolean;
  panSpeed: number;
  screenSpacePanning: boolean;
  keyPanSpeed: number;

  mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE; };
  touches: { ONE: TOUCH; TWO: TOUCH; };
  autoRotate: boolean;
  autoRotateSpeed: number;

  constructor(camera: Camera, domElement: HTMLElement) {
    super(camera, domElement);

    this.domElement.style.touchAction = 'none';

    this.target = new Cartesian3();

    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.minZoom = 0;
    this.maxZoom = Infinity;

    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;

    this.minAzimuthAngle = - Infinity;
    this.maxAzimuthAngle =   Infinity;

    this.enableDamping = false;
    this.dampingFactor = 0.05;

    this.enableZoom = true;
    this.zoomSpeed = 1.0;

    this.enableRotate = true;
    this.rotateSpeed = 1.0;

    this.enablePan = true;
    this.panSpeed = 1.0;
    this.screenSpacePanning = true;
    this.keyPanSpeed = 7.0;

    // Set to true to automatically rotate around the target
		// If auto-rotate is enabled, you must call controls.update() in your animation loop
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60

    // Mouse buttons
    this.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };

    // Touch fingers
    this.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };

    let state = STATE.NONE;

    const EPS = 0.000001;

    let scale = 1.0;

    const spherical = new Spherical();
    const sphericalDelta = new Spherical();

    const rotateStart = new Cartesian2();
    const rotateEnd = new Cartesian2();
    const rotateDelta = new Cartesian2();

    const panOffset = new Cartesian3();
		let zoomChanged = false;

    const panStart = new Cartesian2();
    const panEnd = new Cartesian2();
    const panDelta = new Cartesian2();

    const dollyStart = new Cartesian2();
    const dollyEnd = new Cartesian2();
    const dollyDelta = new Cartesian2();

    const pointers: PointerEvent[] = [];
    const pointerPositions: {
      [id: string]: Cartesian2
    } = {};
    const controller = this;

    function getAutoRotationAngle() : number {
      return 2 * Math.PI / 60 / 60 * controller.autoRotateSpeed;
    }
    function getZoomScale() : number {
      return Math.pow(0.95, controller.zoomSpeed);
    }

    function onContextMenu(event: PointerEvent) {
      if (controller.enabled === false) return;

      event.preventDefault();
    }

    function addPointer(event: PointerEvent) {
      pointers.push(event);
    }

    function removePointer(event: PointerEvent) {
      delete pointerPositions[event.pointerId];

      for (let i = 0; i < pointers.length; i++) {
        if (pointers[i].pointerId === event.pointerId) {
          pointers.splice(i, 1);
          return;
        }
      }
    }

    function trackPointer(event: PointerEvent) {
      let position = pointerPositions[ event.pointerId ];

      if (position === undefined) {
        position = new Cartesian2();
        pointerPositions[ event.pointerId ] = position;
      }

      position.set( event.pageX, event.pageY );
    }

    const panLeft = function() {
      const v = new Cartesian3();
      return function panLeft(distance: number, objectMatrix: Matrix4) {
        Matrix4.getColumn<Cartesian3>(objectMatrix, 0, v);  // get X column of objectMatrix
        Cartesian3.multiplyByScalar(v, -distance, v);

        Cartesian3.add(panOffset, v, panOffset);
      };
    }();
    const panUp = function() {
      const v = new Cartesian3();
      return function panLeft(distance: number, objectMatrix: Matrix4) {
        if (controller.screenSpacePanning === true) {
          Matrix4.getColumn<Cartesian3>(objectMatrix, 1, v);
        } else {
          Matrix4.getColumn<Cartesian3>(objectMatrix, 0, v);
          Cartesian3.cross(controller.camera.upAxis, v, v);
        }
        
        Cartesian3.multiplyByScalar(v, distance, v);

        Cartesian3.add(panOffset, v, panOffset);
      };
    }();
    const pan = function() {
      const offset = new Cartesian3();

      return function pan(deltaX: number, deltaY: number) {
        const element = controller.domElement;
        if (true /* controller.camera.isPerspective */) {
          Cartesian3.clone(controller.camera.position, offset);
          Cartesian3.subtract(offset, controller.target, offset);
          let targetDistance = Cartesian3.magnitude(offset);

          // half of the fov is center to top of screen
          targetDistance *= Math.tan( (MMath.toDegrees(controller.camera.frustum.fov) / 2) * Math.PI / 180.0 );

          panLeft( 2.0 * deltaX * targetDistance / element.clientHeight, controller.camera.inverseViewMatrix );
          panUp( 2.0 * deltaY * targetDistance / element.clientHeight, controller.camera.inverseViewMatrix );
        }
      }
    }();

    function onPointerCancel(event: PointerEvent) {
      removePointer(event);
    }

    function onPointerDown(event: PointerEvent) {
      if (controller.enabled === false) return;

      if (pointers.length === 0) {
        controller.domElement.setPointerCapture(event.pointerId);

        controller.domElement.addEventListener('pointermove', onPointerMove);
        controller.domElement.addEventListener('pointerup', onPointerUp);
      }

      addPointer(event);

      if (event.pointerType === 'touch') {
        onTouchStart(event);
      } else {
        onMouseDown(event);
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (controller.enabled === false) return;

      if (event.pointerType === 'touch') {
        onTouchMove(event);
      } else {
        onMouseMove(event);
      }
    }

    function onPointerUp(event: PointerEvent) {
      if (controller.enabled === false) return;

      if (event.pointerType === 'touch') {
        onTouchEnd(event);
      } else {
        onMouseUp(event);
      }

      removePointer(event);

      if (pointers.length === 0) {
        controller.domElement.releasePointerCapture(event.pointerId);

        controller.domElement.removeEventListener('pointermove', onPointerMove);
        controller.domElement.removeEventListener('pointerup', onPointerUp);
      }
    }

    function onTouchStart(event: PointerEvent) {
      trackPointer(event);

      switch (pointers.length) {
        case 1:

          switch (controller.touches.ONE) {
            case TOUCH.ROTATE:

              if (controller.enableRotate === false) return;

              handleTouchStartRotate();
              state = STATE.TOUCH_ROTATE;

              break;

            case TOUCH.PAN:

              if (controller.enablePan === false) return;

              handleTouchStartPan();
              state = STATE.TOUCH_PAN;

              break;

            default:
              state = STATE.NONE;
          }

          break;

        case 2:

          switch (controller.touches.TWO) {
            case TOUCH.DOLLY_PAN:

              if (controller.enableZoom === false && controller.enablePan === false) return;

              handleTouchStartDollyPan();
              state = STATE.TOUCH_DOLLY_PAN;

              break;

            case TOUCH.DOLLY_ROTATE:

              if (controller.enableZoom === false && controller.enableRotate === false) return;

              handleTouchStartDollyRotate();
              state = STATE.TOUCH_DOLLY_ROTATE;

              break;

            default:
              state = STATE.NONE;
          }

          break;

        default:
          state = STATE.NONE;
      }

      if (state !== STATE.NONE) {
        // controller.dispatchEvent( _startEvent )
      }
    }

    function handleTouchStartRotate() {
      if (pointers.length === 1) {
        rotateStart.set( pointers[ 0 ].pageX, pointers[ 0 ].pageY );
      } else {
        const x = 0.5 * ( pointers[ 0 ].pageX + pointers[ 1 ].pageX );
        const y = 0.5 * ( pointers[ 0 ].pageY + pointers[ 1 ].pageY );

        rotateStart.set( x, y );
      }
    }

    function handleTouchStartPan() {
      if (pointers.length === 1) {
        panStart.set( pointers[0].pageX, pointers[0].pageY );
      } else {
        const x = 0.5 * ( pointers[0].pageX + pointers[1].pageX );
        const y = 0.5 * ( pointers[0].pageY + pointers[1].pageY );

        panStart.set( x, y );
      }
    }

    function handleTouchStartDolly() {
      const dx = pointers[0].pageX - pointers[1].pageX;
      const dy = pointers[0].pageY - pointers[1].pageY;

      const distance = Math.sqrt( dx * dx + dy * dy );
      dollyStart.set(0, distance);
    }

    function handleTouchStartDollyPan() {
      if (controller.enableZoom) handleTouchStartDolly();

      if (controller.enablePan) handleTouchStartPan();
    }

    function handleTouchStartDollyRotate() {
      if (controller.enableZoom) handleTouchStartDolly();

      if (controller.enableRotate) handleTouchStartRotate();
    }

    function onMouseDown(event: PointerEvent) {
      let mouseAction;
      switch (event.button) {
        case 0:
          mouseAction = controller.mouseButtons.LEFT;
          break;
        case 1:
          mouseAction = controller.mouseButtons.MIDDLE;
          break;
        case 2:
          mouseAction = controller.mouseButtons.RIGHT;
          break;
        default:
          mouseAction = -1;
          break;
      }

      switch (mouseAction) {
        case MOUSE.DOLLY:
          if (controller.enableZoom === false) return;
          handleMouseDownDolly(event);
          state = STATE.DOLLY;
          break;
        case MOUSE.ROTATE:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (controller.enablePan === false) return;

            handleMouseDownPan(event);
            state = STATE.PAN;
          } else {
            if ( controller.enableRotate === false ) return;

            handleMouseDownRotate( event );

            state = STATE.ROTATE;
          }
          break;
        case MOUSE.PAN:
          if (event.ctrlKey || event.metaKey || event.shiftKey) {
            if (controller.enableRotate === false) return;

            handleMouseDownRotate(event);
            state = STATE.ROTATE;
          } else {
            if (controller.enablePan === false) return;

            handleMouseDownPan(event);
            state = STATE.PAN;
          }
          break;
        default:
          state = STATE.NONE;
          break;
      }

      if (state !== STATE.NONE) {
        // dispatchEvent( _startEvent )
      }
    }

    function handleMouseDownDolly(event: PointerEvent) {
      dollyStart.x = event.clientX;
      dollyStart.y = event.clientY;
    }

    function handleMouseDownRotate( event ) {
      rotateStart.x = event.clientX;
      rotateStart.y = event.clientY;
    }

    function handleMouseDownPan( event ) {
      panStart.x = event.clientX;
      panStart.y = event.clientY;
    }

    function onTouchMove(event: PointerEvent) {
      trackPointer(event);

      switch (state) {
        case STATE.TOUCH_ROTATE:
          if (controller.enableRotate === false) return;

          handleTouchMoveRotate(event);

          controller.update();

          break;

        case STATE.TOUCH_PAN:
          if (controller.enablePan === false) return;

          handleTouchMovePan(event);

          controller.update();

          break;

        case STATE.TOUCH_DOLLY_PAN:

          if (controller.enableZoom === false && controller.enablePan === false) return;

          handleTouchMoveDollyPan(event);

          controller.update();

          break;

        case STATE.TOUCH_DOLLY_ROTATE:
          if (controller.enableZoom === false && controller.enableRotate === false) return;

          handleTouchMoveDollyRotate(event);

          controller.update();

          break;

        default:
          state = STATE.NONE;
      }
    }

    function getSecondPointerPosition(event: PointerEvent) {
      const pointer = (event.pointerId === pointers[0].pointerId) ? pointers[1] : pointers[0];

      return pointerPositions[pointer.pointerId];
    }

    function handleTouchMoveRotate(event: PointerEvent) {
      if (pointers.length === 1) {

        rotateEnd.set( event.pageX, event.pageY );

      } else {

        const position = getSecondPointerPosition(event);

        const x = 0.5 * ( event.pageX + position.x );
        const y = 0.5 * ( event.pageY + position.y );

        rotateEnd.set( x, y );
      }

      Cartesian2.subtract( rotateEnd, rotateStart, rotateDelta );
      Cartesian2.multiplyByScalar( rotateDelta, controller.rotateSpeed, rotateDelta );

      const element = controller.domElement;

      rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height
      rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

      Cartesian2.clone(rotateEnd, rotateStart);
    }

    function handleTouchMovePan(event: PointerEvent) {
      if (pointers.length === 1) {

        panEnd.set(event.pageX, event.pageY);

      } else {

        const position = getSecondPointerPosition(event);

        const x = 0.5 * ( event.pageX + position.x );
        const y = 0.5 * ( event.pageY + position.y );

        panEnd.set( x, y );

      }

      Cartesian2.subtract( panEnd, panStart, panDelta );
      Cartesian2.multiplyByScalar( panDelta, controller.panSpeed, panDelta );

      pan( panDelta.x, panDelta.y );

      Cartesian2.clone(panEnd, panStart);
    }

    function handleTouchMoveDolly(event: PointerEvent) {
      const position = getSecondPointerPosition( event );

      const dx = event.pageX - position.x;
      const dy = event.pageY - position.y;

      const distance = Math.sqrt( dx * dx + dy * dy );
      dollyEnd.set( 0, distance );

      dollyDelta.set( 0, Math.pow( dollyEnd.y / dollyStart.y, controller.zoomSpeed ) );
      dollyOut( dollyDelta.y );

      Cartesian2.clone(dollyEnd, dollyStart);
    }

    function handleTouchMoveDollyPan(event: PointerEvent) {
      if (controller.enableZoom) handleTouchMoveDolly(event);

      if (controller.enablePan) handleTouchMovePan(event);
    }

    function handleTouchMoveDollyRotate(event: PointerEvent) {
      if (controller.enableZoom) handleTouchMoveDolly(event);

      if (controller.enableRotate) handleTouchMoveRotate(event);
    }

    function onMouseMove(event: PointerEvent) {
      if (controller.enabled === false) return;

      switch (state) {
        case STATE.ROTATE:
          if (controller.enableRotate === false) return;

          handleMouseMoveRotate(event);
          break;
        case STATE.DOLLY:
          if (controller.enableZoom === false) return;

          handleMouseMoveDolly(event);
          break;
        case STATE.PAN:
          if (controller.enablePan === false) return;

          handleMouseMovePan(event);
          break;
      }
    }

    function handleMouseMoveRotate(event: PointerEvent) {
      rotateEnd.set(event.clientX, event.clientY);

      Cartesian2.subtract(rotateEnd, rotateStart, rotateDelta);
      Cartesian2.multiplyByScalar(rotateDelta, controller.rotateSpeed, rotateDelta);

      const element = controller.domElement;
      rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height
      rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

      Cartesian2.clone(rotateEnd, rotateStart);

      controller.update();
    }

    function rotateLeft(angle: number) {
      sphericalDelta.theta -= angle;
    }
    function rotateUp(angle: number) {
      sphericalDelta.phi -= angle;
    }

    function handleMouseMoveDolly(event: PointerEvent) {
      dollyEnd.set(event.clientX, event.clientY);
      Cartesian2.subtract(dollyEnd, dollyStart, dollyDelta);

      if (dollyDelta.y > 0) {
        dollyOut( getZoomScale() );
      } else if (dollyDelta.y < 0) {
        dollyIn( getZoomScale() );
      }

      Cartesian2.clone(dollyEnd, dollyStart);

      controller.update();
    }

    function dollyOut(dollyScale: number) {
      if (true /*controller.camera.isPerspectiveCamera*/) {
        scale /= dollyScale;
      }
    }
    function dollyIn(dollyScale: number) {
      if (true /*controller.camera.isPerspectiveCamera*/) {
        scale *= dollyScale;
      }
    }

    function handleMouseMovePan(event: PointerEvent) {
      panEnd.set( event.clientX, event.clientY);

      Cartesian2.subtract(panEnd, panStart, panDelta);
      Cartesian2.multiplyByScalar(panDelta, controller.panSpeed, panDelta);

      pan(panDelta.x, panDelta.y);

      Cartesian2.clone(panEnd, panStart);

      controller.update();
    }

    function onTouchEnd(event: PointerEvent) {
      handleTouchEnd(event);

      // controller.dispatchEvent(_endEvent);

      state = STATE.NONE;
    }

    function handleTouchEnd(event: PointerEvent) {
      // no-op
    }

    function zoomIn(zoomScale) {
      // if (isPerspectiveCamera)
        scale *= zoomScale;
    }
    function zoomOut(zoomScale) {
      // if (isPerspectiveCamera)
        scale /= zoomScale;
    }

    function onMouseUp(event: PointerEvent) {
      handleMouseUp(event);

      // dispatch _endEvent

      state = STATE.NONE;
    }

    function handleMouseUp(event: PointerEvent) {
      // no-op
    }

    function handleMouseWheel(event: WheelEvent) {
      // event.deltaY: scroll down is positive
      if (event.deltaY < 0) {
        zoomIn(getZoomScale());
      } else if (event.deltaY > 0) {
        zoomOut(getZoomScale());
      }

      controller.update();
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault();

      handleMouseWheel(event);
    }

    this.domElement.addEventListener('contextmenu', onContextMenu);

    this.domElement.addEventListener('pointerdown', onPointerDown);
    this.domElement.addEventListener('pointercancel', onPointerCancel);
    this.domElement.addEventListener('wheel', onWheel, { passive: false });

    this.update = (function() {
      const offset = new Cartesian3();

      // so camera.upAxis is the orbit axis
      const quat = new Quaternion().setFromUnitVectors(controller.camera.upAxis, new Cartesian3(0, 1, 0));
      const quatInverse = Quaternion.clone(quat);
      Quaternion.inverse(quatInverse, quatInverse);

      const lastPosition = new Cartesian3();
      const lastQuaternion = new Quaternion();

      const twoPI = 2.0 * Math.PI;

      const rotateMatrixScratch = new Matrix3();
      const quaternionScratch = new Quaternion();
      const cartesian3Scratch = new Cartesian3();

      return function update() {
        const position = controller.camera.position;

        Cartesian3.clone(position, offset);
        Cartesian3.subtract(offset, controller.target, offset);

        // rotate offset to "y-axis-is-up" space
        offset.applyQuaternion( quat );

        // angle from z-axis around y-axis
        spherical.setFromCartesian3( offset );

        if ( controller.autoRotate && state === STATE.NONE ) {
          rotateLeft( getAutoRotationAngle() );
        }

        if (controller.enableDamping) {
          spherical.theta += sphericalDelta.theta * controller.dampingFactor;
          spherical.phi += sphericalDelta.phi * controller.dampingFactor;
        } else {
          spherical.theta += sphericalDelta.theta;
          spherical.phi += sphericalDelta.phi;
        }

        // restrict theta to be between desired limits
        let min = controller.minAzimuthAngle;
        let max = controller.maxAzimuthAngle;

        if ( isFinite( min ) && isFinite( max ) ) {
          if ( min < - Math.PI ) min += twoPI; else if ( min > Math.PI ) min -= twoPI;

          if ( max < - Math.PI ) max += twoPI; else if ( max > Math.PI ) max -= twoPI;

          if ( min <= max ) {

            spherical.theta = Math.max( min, Math.min( max, spherical.theta ) );

          } else {

            spherical.theta = ( spherical.theta > ( min + max ) / 2 ) ?
              Math.max( min, spherical.theta ) :
              Math.min( max, spherical.theta );

          }
        }

        // restrict phi to be between desired limits
        spherical.phi = Math.max( controller.minPolarAngle, Math.min( controller.maxPolarAngle, spherical.phi ) );

        spherical.makeSafe();

        spherical.radius *= scale;

        // restrict radius to be between desired limits
        spherical.radius = Math.max( controller.minDistance, Math.min( controller.maxDistance, spherical.radius ) );

        // move target to panned location
        if (controller.enableDamping === true) {
          Cartesian3.add(
            controller.target,
            Cartesian3.multiplyByScalar(panOffset, controller.dampingFactor),
            controller.target
          );
        } else {
          Cartesian3.add(controller.target, panOffset, controller.target);
        }

        offset.setFromSpherical( spherical );

        // rotate offset back to "camera-up-vector-is-up" space
        offset.applyQuaternion( quatInverse );

        Cartesian3.clone(controller.target, position);
        Cartesian3.add(position, offset, position);

        controller.camera.lookAt( controller.target );

        if (controller.enableDamping === true) {
          sphericalDelta.theta *= ( 1 - controller.dampingFactor );
          sphericalDelta.phi *= ( 1 - controller.dampingFactor );
          Cartesian3.multiplyByScalar(panOffset, 1 - controller.dampingFactor, panOffset);
        } else {
          sphericalDelta.set(0, 0, 0);
          panOffset.set(0, 0, 0);
        }

        scale = 1;

        // update condition is:
        // min(camera displacement, camera rotation in radians)^2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8

        Matrix3.setColumn(rotateMatrixScratch, 0, controller.camera.right);
        Matrix3.setColumn(rotateMatrixScratch, 1, controller.camera.direction);
        Matrix3.setColumn(rotateMatrixScratch, 2, controller.camera.up);
        Quaternion.fromRotationMatrix(rotateMatrixScratch, quaternionScratch);
        if (
          zoomChanged ||
          Cartesian3.magnitudeSquared(Cartesian3.subtract(lastPosition, controller.camera.position, cartesian3Scratch)) > EPS ||
          8 * ( 1 - Quaternion.dot( lastQuaternion, quaternionScratch ) ) > EPS
        ) {

          // scope.dispatchEvent( _changeEvent );

          Cartesian3.clone(controller.camera.position, lastPosition);
          Quaternion.clone(quaternionScratch, lastQuaternion);
          zoomChanged = false;

          return true;

        }

        return false;
      };
    })();

    this.update();
  }

}

export default OrbitCameraController;
