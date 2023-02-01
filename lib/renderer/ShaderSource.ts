import Context from "./Context";

class ShaderSource {
  sources: string[];

  constructor(options) {
    this.sources = options.sources;
  }

  public createCombinedVertexShader(context: Context): string {
    return this.sources.join('\n');
  }

  public createCombinedFragmentShader(context: Context): string {
    return this.sources.join('\n')
  }
}

export default ShaderSource;
