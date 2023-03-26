import RuntimeError from "../../core/RuntimeError";
import defined from "../../core/defined";
import getMagic from "../getMagic";
import addPipelineExtras from "./GltfPipeline/addPipelineExtras";
import getStringFromTypedArray from "./getStringFromTypedArray";
import { glTF } from "./glTF";

function parseGlb(glb: Uint8Array) : glTF {
  const magic = getMagic(glb);
  if (magic !== 'glTF') {
    throw new RuntimeError('File is not valid binary glTF');
  }

  const header = readHeader(glb, 0, 5);
  const version = header[1];

  if (version !== 1 && version !== 2) {
    throw new RuntimeError('Binary glTF version is not 1 or 2');
  }

  if (version === 1) {
    return parseGlbVersion1(glb, header);
  }

  return parseGlbVersion2(glb, header);
}

const sizeOfUint32 = Uint32Array.BYTES_PER_ELEMENT;

function readHeader(glb: Uint8Array, byteOffset: number, count: number) {
  const dataView = new DataView(glb.buffer);
  const header: number[] = new Array(count);
  for (let i = 0; i < count; ++i) {
    header[i] = dataView.getUint32(
      glb.byteOffset + byteOffset + i * sizeOfUint32,
      true
    );
  }
  return header;
}

function parseGlbVersion1(glb: Uint8Array, header: number[]) : glTF {
  throw new Error("parseGlbVersion1: To be implemented");
}

function parseGlbVersion2(glb: Uint8Array, header: number[]) : glTF {
  const length = header[2];
  let byteOffset = 12; // magic + version + length: 12 bytes
  let gltf: glTF;
  let binaryBuffer: Uint8Array;

  while (byteOffset < length) {
    const [ chunkLength, chunkType ] = readHeader(glb, byteOffset, 2);
    byteOffset += 8;

    const chunkBuffer = glb.subarray(byteOffset, byteOffset + chunkLength);
    byteOffset += chunkLength;

    if (chunkType === 0x4e4f534a) { // JSON chunk
      const gltfString = getStringFromTypedArray(chunkBuffer);
      gltf = JSON.parse(gltfString);

      addPipelineExtras(gltf);
    } else if (chunkType === 0x004e4942) { // Binary chunk
      binaryBuffer = chunkBuffer;
    } else {
      throw new RuntimeError('glb contains a invalid chunk type.');
    }
  }

  if (defined(gltf) && defined(binaryBuffer)) {
    const buffers = gltf.buffers;
    if (defined(buffers) && buffers.length > 0) {
      const buffer = buffers[0];
      buffer.extras._pipeline.source = binaryBuffer;
    }
  }

  return gltf;
}

export default parseGlb;
