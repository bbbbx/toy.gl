function getStringFromTypedArray(
  uint8Array: Uint8Array,
  byteOffset: number = 0,
  byteLength: number = uint8Array.length - byteOffset
) : string {
  const view = uint8Array.subarray(byteOffset, byteOffset + byteLength);

  const decoder = new TextDecoder("utf-8");
  return decoder.decode(view);
}

export default getStringFromTypedArray;
