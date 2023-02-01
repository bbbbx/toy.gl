function defaultValue(value: any, defaultValue: any): any {
  if (value !== undefined && value !== null) {
    return value;
  }
  return defaultValue;
}

/**
 * A frozen empty object that can be used as the default value for options passed as
 * an object literal.
 * @type {Object}
 * @memberof defaultValue
 */
defaultValue.EMPTY_OBJECT = Object.freeze({});

export default defaultValue;
