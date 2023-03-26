import Resource from "../../../core/Resource";
import GltfBufferViewLoader from "./GltfBufferViewLoader";
import ResourceLoader from "./ResourceLoader";
import ResourceLoaderState from "./ResourceLoaderState";
import FrameState from "../../FrameState";
import ResourceCache from "../ResourceCache";
import { glTF } from "../glTF";
import defined from "../../../core/defined";
import RuntimeError from "../../../core/RuntimeError";
import defaultValue from "../../../core/defaultValue";


function getMimeTypeFromTypedArray(typedArray: Uint8Array) : string {
  const header = typedArray.subarray(0, 2);
  const webpHeaderRIFFChars = typedArray.subarray(0, 4);
  const webpHeaderWEBPChars = typedArray.subarray(8, 12);

  if (header[0] === 0xff && header[1] === 0xd8) {
    // See https://en.wikipedia.org/wiki/JPEG_File_Interchange_Format
    return "image/jpeg";
  } else if (header[0] === 0x89 && header[1] === 0x50) {
    // See http://www.libpng.org/pub/png/spec/1.2/PNG-Structure.html
    return "image/png";
  } else if (header[0] === 0xab && header[1] === 0x4b) {
    // See http://github.khronos.org/KTX-Specification/#_identifier
    return "image/ktx2";
  } else if (
    // See https://developers.google.com/speed/webp/docs/riff_container#webp_file_header
    webpHeaderRIFFChars[0] === 0x52 &&
    webpHeaderRIFFChars[1] === 0x49 &&
    webpHeaderRIFFChars[2] === 0x46 &&
    webpHeaderRIFFChars[3] === 0x46 &&
    webpHeaderWEBPChars[0] === 0x57 &&
    webpHeaderWEBPChars[1] === 0x45 &&
    webpHeaderWEBPChars[2] === 0x42 &&
    webpHeaderWEBPChars[3] === 0x50
  ) {
    return "image/webp";
  }

  throw new RuntimeError('Image format is not recognized');
}

function loadImageFromBufferTypedArray(typedArray: Uint8Array) {
  const mimeType = getMimeTypeFromTypedArray(typedArray);

  if (mimeType === 'image/ktx2') {
    // Need to make a copy of the embedded KTX2 buffer otherwise the underlying
    // ArrayBuffer may be accessed on both the worker and the main thread and
    // throw an error like "Cannot perform Construct on a detached ArrayBuffer".
    // Look into SharedArrayBuffer at some point to get around this.
    const ktxBuffer = new Uint8Array(typedArray);

    throw new Error("loadImageFromBufferTypedArray: To be implemented");
    // Resolves to a CompressedTextureBuffer
    // return loadKTX2(ktxBuffer);
  }

  return loadImageFromTypedArray({
    uint8Array: typedArray,
    format: mimeType,
    flipY: false,
    skipColorSpaceConversion: true,
  });
}

const ktx2Regex = /(^data:image\/ktx2)|(\.ktx2$)/i;

function loadImageFromUri(resource: Resource) {
  const uri = resource.getUrlComponent(false, true);
  if (ktx2Regex.test(uri)) {
    throw new Error("loadImageFromUri: To be implemented");
    // Resolves to a CompressedTextureBuffer
    // return loadKTX2(resource);
  }

  // Resolves to an ImageBitmap or Image
  return resource.fetchImage({
    skipColorSpaceConversion: true,
    preferImageBitmap: true,
  });
}

class GltfImageLoader extends ResourceLoader {
  process(frameState: FrameState) {
    debugger
    throw new Error("GltfImageLoader Method not implemented.");
  }
  _resourceCache: typeof ResourceCache;
  _gltf: glTF;
  _gltfResource: Resource;
  _baseResource: Resource;
  _imageIndex: number;
  _image: ImageBitmap;
  _bufferViewIndex: number;
  _bufferViewLoader: GltfBufferViewLoader;
  _uri: string;
  _cacheKey: string;
  _mipLevels: Uint8Array[];
  _state: ResourceLoaderState;
  _promise: Promise<GltfImageLoader>;

  public get promise() : Promise<GltfImageLoader> { return this._promise; }
  public get mipLevels() { return this._mipLevels; }
  public get image() { return this._image; }
  public get cacheKey() { return this._cacheKey; }

  constructor(options: {
    resourceCache: typeof ResourceCache,
    gltf: glTF,
    imageIndex: number,
    gltfResource: Resource,
    baseResource: Resource,
    cacheKey: string,
  }) {
    super();

    const resourceCache = options.resourceCache;
    const gltf = options.gltf;
    const imageIndex = options.imageIndex;
    const gltfResource = options.gltfResource;
    const baseResource = options.baseResource;
    const cacheKey = options.cacheKey;

    const image = gltf.images[imageIndex];
    const bufferViewIndex = image.bufferView;
    const uri = image.uri;

    this._resourceCache = resourceCache;
    this._gltfResource = gltfResource;
    this._baseResource = baseResource;
    this._gltf = gltf;
    this._bufferViewIndex = bufferViewIndex;
    this._uri = uri;
    this._cacheKey = cacheKey;
    this._state = ResourceLoaderState.UNLOADED;
  }

  load() {
    if (defined(this._bufferViewIndex)) {
      this._promise = loadFromBufferView(this);
      return this._promise;
    }

    this._promise = loadFromUri(this);
    return this._promise;
  }

  unload() {
    if (defined(this._bufferViewIndex)) {
      this._resourceCache.unload(this._bufferViewLoader);
    }

    this._bufferViewLoader = undefined;
    this._uri = undefined; // Free in case the uri is a data uri
    this._image = undefined;
    this._mipLevels = undefined;
    this._gltf = undefined;
  }

}

function loadImageFromTypedArray(options: {
  uint8Array: Uint8Array,
  format: string,
  flipY?: boolean,
  skipColorSpaceConversion?: boolean
}) {
  const uint8Array = options.uint8Array;
  const format = options.format;
  // const request = options.request;
  const flipY = defaultValue(options.flipY, false);
  const skipColorSpaceConversion = defaultValue(options.skipColorSpaceConversion, true);

  const blob = new Blob([ uint8Array ], { type: format });

  let blobUrl;
  return Resource.supportsImageBitmapOptions()
    .then(function (supported) {
      if (supported) {
        return Promise.resolve(
          Resource.createImageBitmapFromBlob(blob, {
            flipY: flipY,
            premultiplyAlpha: false,
            skipColorSpaceConversion: skipColorSpaceConversion,
          })
        );
      }

      throw new Error("To be implemented");
      blobUrl = window.URL.createObjectURL(blob);
    })
    .finally(function() {
      if (defined(blobUrl)) {
        window.URL.revokeObjectURL(blobUrl);
      }
    })
    .then(function (result) {
      return result;
    })
    .catch(function (error) {
      return Promise.reject(error);
    });
}

function loadFromUri(imageLoader: GltfImageLoader) {
  const baseResource = imageLoader._baseResource;
  const uri = imageLoader._uri;
  const derivedResource = baseResource.getDerivedResource({ url: uri });
  imageLoader._state = ResourceLoaderState.LOADING;

  return loadImageFromUri(derivedResource)
    .then(function (image) {
      if (imageLoader.isDestroyed()) {
        return;
      }

      const imageAndMipLevels = getImageAndMipLevels(image);

      imageLoader.unload();

      imageLoader._image = imageAndMipLevels.image as ImageBitmap;
      imageLoader._mipLevels = imageAndMipLevels.mipLevels;
      imageLoader._state = ResourceLoaderState.READY;
      return imageLoader;
    })
    .catch(function (error) {
      if (imageLoader.isDestroyed()) {
        return;
      }

      return handleError(imageLoader, error, `Failed to load image: ${uri}`);
    })
    ;
}

function loadFromBufferView(imageLoader: GltfImageLoader) {
  const resourceCache = imageLoader._resourceCache;

  const bufferViewLoader = resourceCache.loadBufferView({
    gltf: imageLoader._gltf,
    bufferViewIndex: imageLoader._bufferViewIndex,
    gltfResource: imageLoader._gltfResource,
    baseResource: imageLoader._baseResource,
  });

  imageLoader._bufferViewLoader = bufferViewLoader;
  imageLoader._state = ResourceLoaderState.LOADING;

  return bufferViewLoader.promise
    .then(function () {
      if (imageLoader.isDestroyed()) {
        return;
      }

      const typedArray = bufferViewLoader.typedArray;
      return loadImageFromBufferTypedArray(typedArray).then(function (image) {
        const imageAndMipLevels = getImageAndMipLevels(image);

        // Unload everything except the image
        imageLoader.unload();

        imageLoader._image = imageAndMipLevels.image as ImageBitmap;
        imageLoader._mipLevels = imageAndMipLevels.mipLevels;
        imageLoader._state = ResourceLoaderState.READY;
        return imageLoader;
      });
    })
    .catch(function (error) {
      if (imageLoader.isDestroyed()) {
        return;
      }

      return handleError(imageLoader, error, 'Failed to load embedded image.');
    })
}

function getImageAndMipLevels(image: ImageBitmap | { bufferView: any }[]) {
  let mipLevels: Uint8Array[];
  let level0: ImageBitmap | { bufferView: any } = image as ImageBitmap;
  if (Array.isArray(image)) {
    mipLevels = image.slice(1, image.length).map(function (mipLevel) {
      return mipLevel.bufferView;
    });
    level0 = image[0];
  }
  return {
    image: level0,
    mipLevels: mipLevels,
  };
}

function handleError(imageLoader: GltfImageLoader, error: Error, errorMessage: string) {
  imageLoader.unload();
  imageLoader._state = ResourceLoaderState.FAILED;
  return Promise.reject(imageLoader.getError(errorMessage, error));
}


export default GltfImageLoader;
