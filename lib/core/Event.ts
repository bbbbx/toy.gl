type Listener = (...args: any[]) => void;

/**
 * @public
 * @example
 * ```js
 * const event = new Event();
 * function listener(arg0, arg1) {
 *   // arg0 is '1'
 *   // arg1 is 2
 * }
 * event.addEventListener(listener);
 * event.raiseEvent('1', 2);
 * event.removeEventListener(listener);
 * ```
 */
class Event {
  _listeners: Listener[];
  _scopes: object[];
  _toRemove: number[];
  _insideRaiseEvent: boolean;

  public get numberOfListeners() : number {
    return this._listeners.length;
  }

  constructor() {
    this._listeners = [];
    this._scopes = [];
    this._toRemove = [];
    this._insideRaiseEvent = false;
  }

  addEventListener(listener: Listener, scope?: object) : () => void {
    this._listeners.push(listener);
    this._scopes.push(scope);

    const event = this;
    return function () {
      event.removeEventListener(listener, scope);
    }
  }

  removeEventListener(listener: Listener, scope?: object) : boolean {
    const listeners = this._listeners;
    const scopes = this._scopes;

    let index = -1;
    for (let i = 0; i < listener.length; i++) {
      if (
        listeners[i] === listener &&
        scopes[i] === scope
      ) {
        index = i;
        break;
      }
    }

    if (index !== -1) {
      if (this._insideRaiseEvent) {
        //In order to allow removing an event subscription from within
        //a callback, we don't actually remove the items here.  Instead
        //remember the index they are at and undefined their value.
        this._toRemove.push(index);
        listeners[index] = undefined;
        scopes[index] = undefined;
      } else {
        listeners.splice(index, 1);
        scopes.splice(index, 1);
      }

      return true;
    }

    return false;
  }

  raiseEvent(...args: any[]) {
    this._insideRaiseEvent = true;

    const listeners = this._listeners;
    const scopes = this._scopes;
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      const scope = scopes[i];
      listener.apply(scope, args);;
    }

    const toRemove = this._toRemove;
    const length = toRemove.length;
    if (length > 0) {
      toRemove.sort(compareNumber);

      for (let i = 0; i < toRemove.length; i++) {
        const index = toRemove[i];
        listeners.splice(index, 1);
        scopes.splice(index, 1);
      }

      toRemove.length = 0;
    }

    this._insideRaiseEvent = false;
  }
}

function compareNumber(a: number, b: number) {
  return b - a;
}

export default Event;