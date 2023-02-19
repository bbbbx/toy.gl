import CubeMapFace from "./CubeMapFace";
import Texture from "./Texture";
import Texture3D from "./Texture3D";

interface TextureAttachment {
  texture: Texture,
  level: number,
}

interface CubeMapFaceAttachment {
  cubeMapFace: CubeMapFace,
  level: number,
}

interface Texture3DAttachment {
  texture3D: Texture3D,
  level: number,
  layer: number,
}

export {
  TextureAttachment,
  CubeMapFaceAttachment,
  Texture3DAttachment,
};
