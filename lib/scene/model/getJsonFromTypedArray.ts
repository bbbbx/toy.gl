import getStringFromTypedArray from "./getStringFromTypedArray";
import { glTF } from "./glTF";

function getJsonFromTypedArray(uint8Array: Uint8Array, byteOffset?: number, byteLength?: number) : glTF {
  return JSON.parse(
    getStringFromTypedArray(uint8Array, byteOffset, byteLength)
  );
}

export default getJsonFromTypedArray;
