/**
 * Clones an object, returning a new object containing the same properties.
 * @param object 
 * @param deep 
 * @returns 
 */
function clone<T>(object: T, deep = false) : T {
  if (object === null || typeof object !== "object") {
    return object;
  }

  const result = new (object.constructor as any)();
  for (const propertyName in object) {
    if (object.hasOwnProperty(propertyName)) {
      let value = object[propertyName];
      if (deep) {
        value = clone(value, deep);
      }
      result[propertyName] = value;
    }
  }

  return result;
}

export default clone;
