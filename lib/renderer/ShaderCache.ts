import defined from "../core/defined";
import { CachedShader } from "./ShaderCache.d";
import Context from "./Context";
import ShaderProgram from "./ShaderProgram";
import ShaderSource from "./ShaderSource";
import { AttributeLocations } from "./ShaderProgram.d";

class ShaderCache {
  _context: Context;
  _shaders: {
    [keyword: string]: CachedShader
  };
  _numberOfShaders: number;
  _shadersToRelease;

  constructor(context: Context) {
    this._context = context;
    this._shaders = {};
    this._numberOfShaders = 0;
    this._shadersToRelease = {};
  }

  public get numberOfShaders() : number {
    return this._numberOfShaders;
  }

  public replaceShaderProgram(options) {
    if (defined(options.shaderProgram)) {
      options.shaderProgram.destroy();
    }

    return this.getShaderProgram(options);
  }

  public getShaderProgram(options: {
    vertexShaderSource: string | ShaderSource,
    fragmentShaderSource: string | ShaderSource,
    attributeLocations: AttributeLocations,
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

    const vertexShaderText = vertexShaderSource.createCombinedVertexShader(this._context);
    const fragmentShaderText = fragmentShaderSource.createCombinedFragmentShader(this._context);

    const keyword = vertexShaderText + fragmentShaderText + JSON.stringify(attributeLocations);
    let cachedShader: CachedShader = undefined;

    if (defined(this._shaders[keyword])) {
      cachedShader = this._shaders[keyword];

      delete this._shadersToRelease[keyword];
    } else {
      const context = this._context;
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
}

export default ShaderCache;
