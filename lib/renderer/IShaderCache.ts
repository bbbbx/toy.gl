import ShaderCache from "./ShaderCache";
import ShaderProgram from "./ShaderProgram";

interface CachedShader {
  cache: ShaderCache,
  shaderProgram: ShaderProgram,
  keyword: string,
  derivedKeywords: string[],
  count: number,
}

export {
  CachedShader,
};
