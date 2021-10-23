import defaultValue from './defaultValue.js';

const cachedBuffer = {};

function isArrayBufferView(value) {
  return value instanceof Float32Array ||
         value instanceof Uint8Array ||
         value instanceof Uint16Array ||
         value instanceof Uint32Array ||
         value instanceof Int8Array ||
         value instanceof Int16Array ||
         value instanceof Int32Array;
}

function getIndicesType(indices) {
  let indicesType;

  if (Array.isArray(indices)) {

    indicesType = gl.UNSIGNED_SHORT;

  } else if (indices instanceof Uint8Array) {

    indicesType = gl.UNSIGNED_BYTE;

  } else if (indices instanceof Uint16Array) {

    indicesType = gl.UNSIGNED_SHORT;

  } else if (indices instanceof Uint32Array) {

    indicesType = gl.UNSIGNED_INT;

  } else {
    throw new Error('indices MUST be instance of Array, Uint8Array, Uint16Array or Uint32Array.');
  }
  return indicesType;
}

function createBuffer(gl, bufferTarget, source, usage) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(bufferTarget, buffer);
  gl.bufferData(bufferTarget, source, usage);
  gl.bindBuffer(bufferTarget, null);
  return buffer;
}

function createAttributeBuffer(gl, typedArrayOrArray, usage) {
  const bufferKey = typedArrayOrArray.toString();
  let buffer = cachedBuffer[bufferKey];
  if (buffer) {
    return buffer;
  }

  usage = defaultValue(usage, gl.STATIC_DRAW);

  let typedArray;
  if (Array.isArray(typedArrayOrArray)) {
    typedArray = new Float32Array(typedArrayOrArray);
  } else if (isArrayBufferView(typedArrayOrArray)) {
    typedArray = typedArrayOrArray;
  } else {
    throw new Error('Buffer data' + typedArrayOrArray + 'must be TypedArray or Array ');
  }

  buffer = createBuffer(gl, gl.ARRAY_BUFFER, typedArray, usage)
  cachedBuffer[bufferKey] = buffer;
  return buffer;
}

function createIndicesBuffer(gl, typedArrayOrArray, usage) {
  const bufferKey = typedArrayOrArray.toString();
  let buffer = cachedBuffer[bufferKey];
  if (buffer) {
    return buffer;
  }

  usage = defaultValue(usage, gl.STATIC_DRAW);

  let typedArray;
  const indicesType = getIndicesType(typedArrayOrArray);

  if (indicesType === gl.UNSIGNED_BYTE) {

    typedArray = new Uint8Array(typedArrayOrArray);

  } else if (indicesType === gl.UNSIGNED_SHORT) {

    typedArray = new Uint16Array(typedArrayOrArray);

  } else if (indicesType === gl.UNSIGNED_INT) {

    typedArray = new Uint32Array(typedArrayOrArray);
    gl.getExtension('OES_element_index_unit');

  } else {
    throw new Error('Buffer data must be TypedArray or Array ');
  }

  buffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, typedArray, usage);
  cachedBuffer[bufferKey] = buffer;
  return buffer;
}

export {
  cachedBuffer,
  createAttributeBuffer,
  createIndicesBuffer,
  getIndicesType,
};
