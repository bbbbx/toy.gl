import Framebuffer from "./Framebuffer";

interface TexSource {
  arrayBufferView?: BufferSource,
  width?: number,
  height?: number,
  videoWidth?: number,
  videoHeight?: number,
  framebuffer?: Framebuffer | Object,
  xOffset?: number,              // used for framebuffer source
  yOffset?: number,              // used for framebuffer source
  mipLevels?: ArrayBufferView[], // start at mip level 1
}

export {
  TexSource,
};
