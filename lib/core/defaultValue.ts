/**
 * Returns the first parameter if not undefined, otherwise the second parameter.
 * Useful for setting a default value for a parameter.
 * @param value - The value
 * @param defaultValue - The default value
 * @returns Returns the first parameter if not undefined, otherwise the second parameter.
 * @public
 */
function defaultValue<T>(value: T, defaultValue: T): T {
  if (value !== undefined && value !== null) {
    return value;
  }
  return defaultValue;
}

/**
 * A frozen empty object that can be used as the default value for options passed as
 * an object literal.
 * 
 * @readonly
 */
defaultValue.EMPTY_OBJECT = Object.freeze({});

export default defaultValue;
