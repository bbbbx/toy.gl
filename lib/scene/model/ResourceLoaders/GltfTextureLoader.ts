import Resource from "../../../core/Resource";
import defaultValue from "../../../core/defaultValue";
import defined from "../../../core/defined";
import Context from "../../../renderer/Context";
import Texture from "../../../renderer/Texture";
import GltfImageLoader from "./GltfImageLoader";
import ResourceLoader from "./ResourceLoader";
import ResourceLoaderState from "./ResourceLoaderState";
import GltfLoaderUtil from "../GltfLoaderUtil";
import SupportedImageFormats from "../SupportedImageFormats";
import FrameState from "../../FrameState";
import ResourceCache from "../ResourceCache";
import { TextureInfo, glTF } from "../glTF";
import CompressedTextureBuffer from "../../../core/CompressedTextureBuffer";
import isCompressedFormat from "../../../core/isCompressedFormat";
import TextureMinificationFilter from "../../../renderer/TextureMinificationFilter";
import TextureWrap from "../../../renderer/TextureWrap";
import MMath from "../../../math/Math";
import resizeImageToNextPowerOfTwo from "../../../core/resizeImageToNextPowerOfTwo";
import Job from "../../Job";
import JobType from "../../JobType";

class CreateTextureJob implements Job {
  gltf: glTF;
  textureInfo: TextureInfo;
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement | CompressedTextureBuffer;
  mipLevels: Uint8Array[];
  context: Context;
  texture: Texture;

  constructor() {}

  set(
    gltf: glTF,
    textureInfo: TextureInfo,
    image: ImageBitmap | HTMLImageElement | HTMLCanvasElement | CompressedTextureBuffer,
    mipLevels: Uint8Array[],
    context: Context
  ) {
    this.gltf = gltf;
    this.textureInfo = textureInfo;
    this.image = image;
    this.mipLevels = mipLevels;
    this.context = context;
  }

  execute(): void {
    this.texture = createTexture(this.gltf, this.textureInfo, this.image, this.mipLevels, this.context);
  }
}

const scratchTextureJob = new CreateTextureJob();

class GltfTextureLoader extends ResourceLoader {
  _resourceCache: typeof ResourceCache;
  _gltf: glTF;
  _textureInfo: TextureInfo;
  _gltfResource: Resource;
  _baseResource: Resource;
  _imageIndex: number;
  _image: ImageBitmap | HTMLImageElement | HTMLCanvasElement;
  _mipLevels: Uint8Array[];
  _imageLoader: GltfImageLoader;
  _texture: Texture;
  _cacheKey: string;
  _asynchronous: boolean;
  _state: ResourceLoaderState;
  _promise: Promise<GltfTextureLoader> | undefined;
  _process: (loader: GltfTextureLoader, frameState: FrameState) => void;

  get promise() { return this._promise; }
  get texture() { return this._texture; }
  get cacheKey() { return this._cacheKey; }

  constructor(options: {
    resourceCache: typeof ResourceCache,
    gltf: glTF,
    textureInfo: TextureInfo,
    baseResource: Resource,
    gltfResource: Resource,
    cacheKey: string,
    supportedImageFormats: SupportedImageFormats,
    asynchronous?: boolean,
  }) {
    super();

    const resourceCache = options.resourceCache;
    const gltf = options.gltf;
    const textureInfo = options.textureInfo;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;
    const cacheKey = options.cacheKey;
    const supportedImageFormats = options.supportedImageFormats;
    const asynchronous = defaultValue(options.asynchronous, true);

    const imageIndex = GltfLoaderUtil.getImageIndexFromTexture({
      gltf: gltf,
      textureIndex: textureInfo.index,
      supportedImageFormats: supportedImageFormats,
    });

    this._resourceCache = resourceCache;
    this._gltf = gltf;
    this._textureInfo = textureInfo;
    this._imageIndex = imageIndex;
    this._gltfResource = gltfResource;
    this._baseResource = baseResource;
    this._cacheKey = cacheKey;
    this._asynchronous = asynchronous;

    this._state = ResourceLoaderState.UNLOADED;
    this._process = function () { debugger; };
  }

  load() {
    const resourceCache = this._resourceCache;
    const imageLoader = resourceCache.loadImage({
      gltf: this._gltf,
      imageIndex: this._imageIndex,
      gltfResource: this._gltfResource,
      baseResource: this._baseResource,
    });

    this._imageLoader = imageLoader;
    this._state = ResourceLoaderState.LOADING;

    const textureLoader = this;
    const processPromise: Promise<GltfTextureLoader> = new Promise(function(resolve) {
      textureLoader._process = function(loader: GltfTextureLoader, frameState) {
        if (defined(loader._texture)) {
          // Already created texture
          return;
        }

        if (!defined(loader._image)) {
          // Not ready to create texture
          return;
        }

        let texture;

        if (loader._asynchronous) {

          const textureJob = scratchTextureJob;
          textureJob.set(
            loader._gltf,
            loader._textureInfo,
            loader._image,
            loader._mipLevels,
            frameState.context
          );
          if (! frameState.jobScheduler.execute(textureJob, JobType.TEXTURE)) {
            // Job scheduler is full. Try again next frame.
            return;
          }
          texture = textureJob.texture;

        } else {
          texture = createTexture(
            loader._gltf,
            loader._textureInfo,
            loader._image,
            loader._mipLevels,
            frameState.context
          );
        }

        // Unload everything except the texture
        loader.unload();

        loader._texture = texture;
        loader._state = ResourceLoaderState.READY;
        resolve(loader);
      };
    });

    this._promise = imageLoader.promise
      .then(function() {
        if (textureLoader.isDestroyed()) {
          return;
        }

        textureLoader._image = imageLoader.image;
        textureLoader._mipLevels = imageLoader.mipLevels;
        textureLoader._state = ResourceLoaderState.PROCESSING;
        return processPromise;
      })
      .catch(function (error) {
        if (textureLoader.isDestroyed()) {
          return;
        }

        textureLoader.unload();
        textureLoader._state = ResourceLoaderState.FAILED;
        const errorMessage = 'Failed to load texture';
        return Promise.reject(textureLoader.getError(errorMessage, error))
      });

    return this._promise;
  }

  process(frameState: FrameState) {
    return this._process(this, frameState);
  }

  unload() {
    if (defined(this._texture)) {
      this._texture.destroy();
    }

    if (defined(this._imageLoader)) {
      this._resourceCache.unload(this._imageLoader);
    }

    this._imageLoader = undefined;
    this._image = undefined;
    this._mipLevels = undefined;
    this._texture = undefined;
    this._gltf = undefined;
  }
}

function createTexture(
  gltf: glTF,
  textureInfo: TextureInfo,
  image: ImageBitmap | HTMLImageElement | HTMLCanvasElement | CompressedTextureBuffer,
  mipLevels: Uint8Array[],
  context: Context
) : Texture {
  // internalFormat is only defined for CompressedTextureBuffer
  const internalFormat = (image as CompressedTextureBuffer).internalFormat;

  let compressedTextureNoMipmap = false;
  if (isCompressedFormat(internalFormat) && !defined(mipLevels)) {
    compressedTextureNoMipmap = true;
  }

  const sampler = GltfLoaderUtil.createSampler({
    gltf: gltf,
    textureInfo: textureInfo,
    compressedTextureNoMipmap: compressedTextureNoMipmap,
  });

  const minFilter = sampler.minificationFilter;
  const wrapS = sampler.wrapS;
  const wrapT = sampler.wrapT;

  const samplerRequiresMipmap =
    minFilter === TextureMinificationFilter.NEAREST_MIPMAP_NEAREST ||
    minFilter === TextureMinificationFilter.NEAREST_MIPMAP_LINEAR ||
    minFilter === TextureMinificationFilter.LINEAR_MIPMAP_NEAREST ||
    minFilter === TextureMinificationFilter.LINEAR_MIPMAP_LINEAR;

  // generateMipmap is disallowed for compressed textures. Compressed textures
  // can have mipmaps but they must come with the KTX2 instead of generated by
  // WebGL. Also note from the KHR_texture_basisu spec:
  //
  //   When a texture refers to a sampler with mipmap minification or when the
  //   sampler is undefined, the KTX2 image SHOULD contain a full mip pyramid.
  //
  const generateMipmap = !defined(internalFormat) && samplerRequiresMipmap;

  // WebGL 1 requires power-of-two texture dimensions for mipmapping and REPEAT/MIRRORED_REPEAT wrap modes.
  const requiresPowerOfTwo =
    generateMipmap ||
    wrapS === TextureWrap.REPEAT ||
    wrapS === TextureWrap.MIRRORED_REPEAT ||
    wrapT === TextureWrap.REPEAT ||
    wrapT === TextureWrap.MIRRORED_REPEAT;

  const nonPowerOfTwo =
    MMath.isPowerOfTwo(image.width) ||
    MMath.isPowerOfTwo(image.height);

  const requiresResize = requiresPowerOfTwo && nonPowerOfTwo;

  let texture;
  if (defined(internalFormat)) {
    if (
      !context.webgl2 &&
      isCompressedFormat(internalFormat) &&
      nonPowerOfTwo &&
      requiresPowerOfTwo
    ) {
      console.warn('Compressed texture uses REPEAT or MIRRORED_REPEAT texture wrap mode and dimensions are not powers of two. The texture may be rendered incorrectly.');
    }

    texture = new Texture({
      context: context,
      source: {
        arrayBufferView: (image as CompressedTextureBuffer).bufferView, // Only defined for CompressedTextureBuffer
        mipLevels: mipLevels,
      },
      width: image.width,
      height: image.height,
      pixelFormat: (image as CompressedTextureBuffer).internalFormat, // Only defined for CompressedTextureBuffer
      sampler: sampler,
    });
  } else {
    if (requiresResize) {
      image = resizeImageToNextPowerOfTwo(image as Exclude<Parameters<typeof createTexture>[2], CompressedTextureBuffer>);
    }

    texture = new Texture({
      context: context,
      source: image as ImageBitmap,
      sampler: sampler,
      flipY: false,
      skipColorSpaceConversion: true,
    });
  }

  if (generateMipmap) {
    texture.generateMipmap();
  }

  return texture;
}


export default GltfTextureLoader;
