(function() {

function define(a) {
  if (a === undefined || a === null) {
    return false;
  }
  return true;
}

function CanvasHandler(canvas) {
  if (!define(canvas)) {
    throw new Error('CanvasHandler: the first parameter must exit.');
  }

  this.canvas = canvas;

  this._lastMovement = { x: 0, y: 0 };
  this._isMouseDown = false;
  this._onWheelHandler = createWheelHandler(this);
  this._onMouseDownHandler = createMouseDownHandler(this);
  this._onMouseUpHandler = createMouseUpHandler(this);
  this._onMouseMoveHandler = createMouseMoveHandler(this);

  canvas.addEventListener('wheel', this._onWheelHandler, false);
  canvas.addEventListener('mousedown', this._onMouseDownHandler, false);
  canvas.addEventListener('mouseup', this._onMouseUpHandler, false);
  canvas.addEventListener('mousemove', this._onMouseMoveHandler, false);

  this.onwheel = undefined;
  this.ondrag = undefined;
}

CanvasHandler.prototype.destroy = function() {
  this.canvas.removeEventListener('wheel', this._onWheelHandler);
  this.canvas.removeEventListener('mousedown', this._onMouseDownHandler);
  this.canvas.removeEventListener('mouseup', this._onMouseUpHandler);
  this.canvas.removeEventListener('mousemove', this._onMouseMoveHandler);
};

function createWheelHandler(canvasHandler) {
  return function(event) {
    if (canvasHandler.onwheel) {
      // event.deltaY:
      //   Firefox: 3
      //   Chrome: 100
      // event.deltaMode
      //   Firefox: event.DOM_DELTA_LINE
      //   Chrome: event.DOM_DELTA_PIXEL
      const direction = Math.sign(event.deltaY);
      canvasHandler.onwheel(direction);
    }
  };
}

function createMouseDownHandler(canvasHandler) {
  return function(event) {
    canvasHandler._isMouseDown = true;
    canvasHandler._lastMovement.x = event.offsetX;
    canvasHandler._lastMovement.y = event.offsetY;
  };
}

function createMouseUpHandler(canvasHandler) {
  return function(event) {
    canvasHandler._isMouseDown = false;
  };
}

function createMouseMoveHandler(canvasHandler) {
  return function(event) {
    if (canvasHandler._isMouseDown && canvasHandler.ondrag) {
      const currentMovement = { x: event.offsetX, y: event.offsetY };

      const deltaMovement = {
        x: currentMovement.x - canvasHandler._lastMovement.x,
        y: currentMovement.y - canvasHandler._lastMovement.y,
      };

      canvasHandler.ondrag(deltaMovement);

      canvasHandler._lastMovement.x = currentMovement.x;
      canvasHandler._lastMovement.y = currentMovement.y;
    }
  };
}

function resizeCanvasToDisplaySize(canvas) {
  const displayWidth  = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  const needResize = canvas.width  !== displayWidth ||
                    canvas.height !== displayHeight;

  if (needResize) {
    canvas.width  = displayWidth;
    canvas.height = displayHeight;
  }

  return needResize;
}

window.WebGLUtils = {
  CanvasHandler: CanvasHandler,
  resizeCanvasToDisplaySize: resizeCanvasToDisplaySize,
};

})();