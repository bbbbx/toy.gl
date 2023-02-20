import defined from "../core/defined";
import destroyObject from "../core/destroyObject";
import Context from "./Context";
import ShaderProgram from "./ShaderProgram";
import ShaderSource from "./ShaderSource";
import { AttributeLocations } from "./IShaderProgram";
import { CachedShader } from "./IShaderCache";

/**
 * @public
 * See {@link Context.shaderCache}
 */
class ShaderCache {
  _context: Context;
  _shaders: {
    [keyword: string]: CachedShader
  };
  _numberOfShaders: number;
  _shadersToRelease: {
    [key: string]: CachedShader,
  };

  constructor(context: Context) {
    this._context = context;
    this._shaders = {};
    this._numberOfShaders = 0;
    this._shadersToRelease = {};
  }

  public get numberOfShaders() : number {
    return this._numberOfShaders;
  }

  public replaceShaderProgram(options: {
    shaderProgram: ShaderProgram,
    vertexShaderSource: string | ShaderSource,
    fragmentShaderSource: string | ShaderSource,
    attributeLocations?: AttributeLocations,
  }) {
    if (defined(options.shaderProgram)) {
      options.shaderProgram.destroy();
    }

    return this.getShaderProgram(options);
  }

  public getShaderProgram(options: {
    vertexShaderSource: string | ShaderSource,
    fragmentShaderSource: string | ShaderSource,
    attributeLocations?: AttributeLocations,
  }): ShaderProgram {
    let vertexShaderSource = options.vertexShaderSource;
    let fragmentShaderSource = options.fragmentShaderSource;
    const attributeLocations = options.attributeLocations;

    if (typeof vertexShaderSource === 'string') {
      vertexShaderSource = new ShaderSource({
        sources: [vertexShaderSource]
      });
    }
    if (typeof fragmentShaderSource === 'string') {
      fragmentShaderSource = new ShaderSource({
        sources: [fragmentShaderSource]
      });
    }

    const vertexShaderKey = vertexShaderSource.getCacheKey();
    const fragmentShaderKey = fragmentShaderSource.getCacheKey();
    const attributeLocationKey = defined(attributeLocations) ? toSortedJson(attributeLocations) : '';
    const keyword = `${vertexShaderKey}:${fragmentShaderKey}:${attributeLocationKey}`;

    let cachedShader: CachedShader = undefined;
    if (defined(this._shaders[keyword])) {
      cachedShader = this._shaders[keyword];

      // No longer want to release this if it was previously released.
      delete this._shadersToRelease[keyword];
    } else {
      const context = this._context;
      const vertexShaderText = vertexShaderSource.createCombinedVertexShader(context);
      const fragmentShaderText = fragmentShaderSource.createCombinedFragmentShader(context);

      const shaderProgram = new ShaderProgram({
        gl: context._gl,
        logShaderCompilation: context.logShaderCompilation,
        debugShaders: context.debugShaders,
        vertexShaderSource: vertexShaderSource,
        vertexShaderText: vertexShaderText,
        fragmentShaderSource: fragmentShaderSource,
        fragmentShaderText: fragmentShaderText,
        attributeLocations: attributeLocations,
      });

      cachedShader = {
        cache: this,
        shaderProgram: shaderProgram,
        keyword: keyword,
        derivedKeywords: [],
        count: 0,
      };

      // A shader can't be in more than one cache.
      shaderProgram._cachedShader = cachedShader;
      this._shaders[keyword] = cachedShader;
      ++this._numberOfShaders;
    }

    ++cachedShader.count;
    return cachedShader.shaderProgram;
  }

  releaseShaderProgram(shaderProgram: ShaderProgram) {
    const cachedShader = shaderProgram._cachedShader;
    if (defined(cachedShader) && --cachedShader.count === 0) {
      this._shadersToRelease[cachedShader.keyword] = cachedShader;
    }
  }

  destroyReleasedShaderPrograms() {
    const shadersToRelease = this._shadersToRelease;
    for (const key in shadersToRelease) {
      if (shadersToRelease.hasOwnProperty(key)) {
        const cachedShader = shadersToRelease[key];
        destroyShader(this, cachedShader);
        --this._numberOfShaders;
      }
    }
  }

  isDestroyed() {
    return false;
  }

  destroy() {
    const shaders = this._shaders;
    for (const keyword in shaders) {
      if (shaders.hasOwnProperty(keyword)) {
        shaders[keyword].shaderProgram.finalDestroy();
      }
    }
    return destroyObject(this);
  }
}

function toSortedJson(dictionary) {
  const sortedKeys = Object.keys(dictionary).sort();
  return JSON.stringify(dictionary, sortedKeys);
}

function destroyShader(cache: ShaderCache, cachedShader: CachedShader) {
  const derivedKeywords = cachedShader.derivedKeywords;
  for (const derivedKeyword of derivedKeywords) {
    const keyword = derivedKeyword + cachedShader.keyword;
    const derivedCachedShader = cache._shaders[keyword];
    destroyShader(cache, derivedCachedShader);
  }

  delete cache._shaders[cachedShader.keyword];
  cachedShader.shaderProgram.finalDestroy();
}

export default ShaderCache;
