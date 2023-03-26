import getStringFromTypedArray from "./model/getStringFromTypedArray";

function getMagic(uint8Array: Uint8Array, byteOffset = 0) : string {
  const byteLength = Math.min(4, uint8Array.length);

  return getStringFromTypedArray(uint8Array, byteOffset, byteLength);
}

export default getMagic;
