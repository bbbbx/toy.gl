import defined from "../../core/defined";
import GltfIndexBufferLoader from "./ResourceLoaders/GltfIndexBufferLoader";
import GltfTextureLoader from "./ResourceLoaders/GltfTextureLoader";
import GltfVertexBufferLoader from "./ResourceLoaders/GltfVertexBufferLoader";
import ResourceLoader from "./ResourceLoaders/ResourceLoader";

class ResourceCacheStatistics {
  geometryByteLength: number;
  textureByteLength: number;

  _geometrySizes: { [cacheKey: string]: number };
  _textureSizes: { [cacheKey: string]: number };;

  constructor() {
    this.geometryByteLength = 0;
    this.textureByteLength = 0;

    this._geometrySizes = {};
    this._textureSizes = {};
  }

  clear() {
    this.geometryByteLength = 0;
    this.textureByteLength = 0;

    this._geometrySizes = {};
    this._textureSizes = {};
  }

  addGeometryLoader(loader: GltfVertexBufferLoader | GltfIndexBufferLoader) {
    const cacheKey = loader.cacheKey;

    // Don't double count the same resource.
    if (this._geometrySizes.hasOwnProperty(cacheKey)) {
      return;
    }

    this._geometrySizes[cacheKey] = 0;

    const cacheStatistics = this;
    return loader.promise
      .then(function(loader: GltfVertexBufferLoader | GltfIndexBufferLoader) {
        // loader was unloaded before its promise resolved
        if (!cacheStatistics._geometrySizes.hasOwnProperty(cacheKey)) {
          return;
        }

        const buffer = loader.buffer;
        const typedArray = loader.typedArray;

        let totalSize = 0;

        if (defined(buffer)) {
          totalSize += buffer.sizeInBytes;
        }

        if (defined(typedArray)) {
          totalSize += typedArray.byteLength;
        }

        cacheStatistics.geometryByteLength += totalSize;
        cacheStatistics._geometrySizes[cacheKey] = totalSize;
      })
      .catch(function () {
        // If the resource failed to load, remove it from the cache
        delete cacheStatistics._geometrySizes[cacheKey];
      });
  }

  addTextureLoader(loader: GltfTextureLoader) {
    const cacheKey = loader.cacheKey;

    // Don't double count the same resource.
    if (this._textureSizes.hasOwnProperty(cacheKey)) {
      return;
    }

    this._textureSizes[cacheKey] = 0;

    const cacheStatistics = this;
    return loader.promise
      .then(function(loader: GltfTextureLoader) {
        // loader was unloaded before its promise resolved
        if (!cacheStatistics._textureSizes.hasOwnProperty(cacheKey)) {
          return;
        }

        const totalSize = loader.texture.sizeInByte;

        cacheStatistics.textureByteLength += totalSize;
        cacheStatistics._textureSizes[cacheKey] = totalSize;
      })
      .catch(function () {
        delete cacheStatistics._textureSizes[cacheKey];
      });
  }

  removeLoader(loader: ResourceLoader) {
    const cacheKey = loader.cacheKey;

    const geometrySize = this._geometrySizes[cacheKey];
    delete this._geometrySizes[cacheKey];

    if (defined(geometrySize)) {
      this.geometryByteLength -= geometrySize;
    }

    const textureSize = this._textureSizes[cacheKey];
    delete this._textureSizes[cacheKey];

    if (defined(textureSize)) {
      this.textureByteLength -= textureSize;
    }
  }
}

export default ResourceCacheStatistics;
