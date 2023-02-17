import DeveloperError from "./DeveloperError";
import defaultValue from "./defaultValue";

function returnTrue() {
  return true;
}

/**
 * @public
 */
function destroyObject(object, message: string = 'This object was destroyed, i.e., destroy() was called.') {
  function throwOnDestroyed() {
    throw new DeveloperError(message);
  }

  for (const key in object) {
    if (typeof object[key] === 'function') {
      object[key] = throwOnDestroyed;
    }
  }

  object.isDestroyed = returnTrue;

  return undefined;
}

export default destroyObject;
