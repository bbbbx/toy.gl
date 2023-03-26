import defaultValue from "../../core/defaultValue";
import defined from "../../core/defined";
import Cartesian2 from "../../math/Cartesian2";
import Matrix3 from "../../math/Matrix3";
import Sampler from "../../renderer/Sampler";
import Texture from "../../renderer/Texture";
import TextureMagnificationFilter from "../../renderer/TextureMagnificationFilter";
import TextureMinificationFilter from "../../renderer/TextureMinificationFilter";
import TextureWrap from "../../renderer/TextureWrap";
import { TextureReader } from "./ModelComponents";
import SupportedImageFormats from "./SupportedImageFormats";
import { TextureInfo, glTF } from "./glTF";

namespace GltfLoaderUtil {
  export function createSampler(options: {
    gltf: glTF,
    textureInfo: TextureInfo,
    compressedTextureNoMipmap?: boolean
  }) : Sampler {
    const gltf = options.gltf;
    const textureInfo = options.textureInfo;
    const compressedTextureNoMipmap = defaultValue(options.compressedTextureNoMipmap, false);

    // Default sampler properties
    let wrapS = TextureWrap.REPEAT;
    let wrapT = TextureWrap.REPEAT;
    let wrapR = TextureWrap.REPEAT;
    let minFilter = TextureMinificationFilter.LINEAR;
    let magFilter = TextureMagnificationFilter.LINEAR;

    const texture = gltf.textures[textureInfo.index];
    const samplerIndex = texture.sampler;

    if (defined(samplerIndex)) {
      const sampler = gltf.samplers[samplerIndex];
      wrapS = defaultValue(sampler.wrapS, wrapS);
      wrapT = defaultValue(sampler.wrapT, wrapT);
      // wrapR = defaultValue(sampler.wrapR, wrapR);
      minFilter = defaultValue(sampler.minFilter, minFilter);
      magFilter = defaultValue(sampler.magFilter, magFilter);
    }

    let useTextureTransform = false;
    if (textureInfo.extensions?.KHR_texture_transform) {
      useTextureTransform = true;
    }

    return new Sampler({
      wrapS: wrapS,
      wrapT: wrapT,
      wrapR: wrapR,
      minificationFilter: minFilter,
      magnificationFilter: magFilter,
    });

  }

  export function getImageIndexFromTexture(options: {
    gltf: glTF,
    textureIndex: number,
    supportedImageFormats: SupportedImageFormats,
  }) : number {
    const gltf = options.gltf;
    const textureIndex = options.textureIndex;
    const supportedImageFormats = options.supportedImageFormats;

    const texture = gltf.textures[textureIndex];

    const extension = texture.extensions;
    if (defined(extension)) {
      if (defined(extension.EXT_texture_webp) && supportedImageFormats.webp) {

        return extension.EXT_texture_webp.source;

      } else if (defined(extension.KHR_texture_basisu) && supportedImageFormats.basis) {

        return extension.KHR_texture_basisu.source;

      }
    }

    return texture.source;
  }

  export function createModelTextureReader(options: {
    textureInfo,
    channels?: string,
    texture?: Texture,
  }) : TextureReader {
    const textureInfo = options.textureInfo;
    const channels = options.channels;
    const texture = options.texture;

    let texCoord = defaultValue(textureInfo.texCoord, 0);
    let transform;

    const textureTransform = textureInfo.extensions?.KHR_texture_transform;
    if (defined(textureTransform)) {
      texCoord = defaultValue(textureTransform.texCoord, texCoord);

      const offset = defined(textureTransform.offset)
        ? Cartesian2.unpack(textureTransform.offset)
        : Cartesian2.ZERO;
      let rotation = defaultValue(textureTransform.rotation, 0.0);
      const scale = defined(textureTransform.scale)
        ? Cartesian2.unpack(textureTransform.scale)
        : Cartesian2.ONE;

      // glTF assumes UV coordinates start with (0, 0) in the top left corner
      // (y-down) unlike WebGL which puts (0, 0) in the bottom left corner (y-up).
      // This means rotations are reversed since the angle from x to y is now
      // clockwise instead of CCW. Translations and scales are not impacted by
      // this.
      rotation = -rotation

      transform = new Matrix3(
        Math.cos(rotation) * scale.x, -Math.sin(rotation) * scale.y, offset.x,
        Math.sin(rotation) * scale.x,  Math.cos(rotation) * scale.y, offset.y,
        0.0, 0.0, 1.0
      );
    }

    const textureReader = new TextureReader();
    textureReader.index = textureInfo.index;
    textureReader.texture = texture;
    textureReader.texCoord = texCoord;
    textureReader.transform = transform;
    textureReader.channels = channels;

    return textureReader;
  }
}

export default GltfLoaderUtil;
