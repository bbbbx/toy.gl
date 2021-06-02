function defaultValue(a, b) {
  if (a === null || a === undefined) {
    return b;
  }
  return a;
}

defaultValue.EMPTY_OBJECT = Object.freeze({});

export default defaultValue;
