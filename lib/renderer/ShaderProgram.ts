import defined from "../core/defined";
import destroyObject from "../core/destroyObject";
import ShaderSource from "./ShaderSource";
import Context from "./Context";
import { createUniform, Uniform, UniformSampler } from "./createUniform";
import { AttributeLocations } from "./IShaderProgram";
import { CachedShader } from "./IShaderCache";
import { UniformMap } from "./IDrawCommand";
import { createUniformArray, UniformArray, UniformArraySampler } from "./createUniformArray";
import DeveloperError from "../core/DeveloperError";
import UniformState from "./UniformState";
import AutomaticUniform from "./AutomaticUniform";
import AutomaticUniforms from "./AutomaticUniforms";

function handleUniformPrecisionMismatches(vertexShaderText: string, fragmentShaderText: string) {
  const duplicateUniformNames = {};
  return {
    fragmentShaderText: fragmentShaderText,
    duplicateUniformNames: duplicateUniformNames,
  };
}

let nextShaderProgramId = 0;

/**
 * @public
 */
class ShaderProgram {
  /** @internal */
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  /** @internal */
  _program: WebGLProgram;
  /** @internal */
  _cachedShader: CachedShader;

  maximumTextureUnitIndex: number;

  /** @internal */
  _vertexShaderSource: ShaderSource;
  /** @internal */
  _vertexShaderText: string;
  /** @internal */
  _fragmentShaderSource: ShaderSource;
  /** @internal */
  _fragmentShaderText: string;

  /** @internal */
  _attributeLocations: AttributeLocations;
  /** @internal */
  _numberOfVertexAttributes: number;
  /** @internal */
  _vertexAttributes: {
    [name: string]: {
      name: string,
      type: number,
      index: number,
    }
  };
  /** @internal */
  _uniformsByName: {
    [name: string]: Uniform | UniformArray,
  };
  /** @internal */
  _uniforms: (Uniform | UniformArray)[];
  /** @internal */
  _automaticUniforms: {
    automaticUniform: AutomaticUniform,
    uniform: Uniform | UniformArray
  }[];
  /** @internal */
  _manualUniforms: (Uniform | UniformArray)[];
  /** @internal */
  _duplicateUniformNames;

  /** @internal */
  id: number;

  /** @internal */
  _logShaderCompilation: boolean;
  /** @internal */
  _debugShaders: WEBGL_debug_shaders;

  /**
   * Use {@link ShaderProgram.fromCache}
   * @param options -
   * @internal
   */
  constructor(options: {
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    vertexShaderSource?: ShaderSource,
    vertexShaderText: string,
    fragmentShaderSource?: ShaderSource,
    fragmentShaderText: string,
    attributeLocations?: AttributeLocations,
    logShaderCompilation?: boolean,
    debugShaders?: WEBGL_debug_shaders,
  }) {
    this._gl = options.gl;
    this._logShaderCompilation = options.logShaderCompilation;
    this._debugShaders = options.debugShaders;
    this._attributeLocations = options.attributeLocations;

    let vertexShaderText = options.vertexShaderText;
    let fragmentShaderText = options.fragmentShaderText;

    const modifiedFS = handleUniformPrecisionMismatches(vertexShaderText, fragmentShaderText);

    this._duplicateUniformNames = modifiedFS.duplicateUniformNames;

    this.maximumTextureUnitIndex = undefined;

    this._vertexShaderSource = options.vertexShaderSource;
    this._vertexShaderText = options.vertexShaderText;
    this._fragmentShaderSource = options.fragmentShaderSource;
    this._fragmentShaderText = modifiedFS.fragmentShaderText; // options.vertexShaderText;

    this.id = nextShaderProgramId++;
  }

  /** @internal */
  _bind() {
    initialize(this);
    this._gl.useProgram(this._program);
  }

  /**
   * @param options -
   * @returns 
   * @example
   * Create a ShaderProgram instance or get it from cache:
   * ```js
   * const shaderProgram = ShaderProgram.fromCache({
   *   context: context,
   *   vertexShaderSource: `
   *     in vec3 aPosition;
   *     void main() {
   *       gl_Position = vec4(aPosition, 1.0);
   *     }
   *   `,
   *   fragmentShaderSource: `
   *     layout (location = 0) out vec4 outColor0;
   *     void main() {
   *       outColor0 = vec4(1.0); // or use `out_FragColor` without `out` declaration
   *     }
   *   `,
   * });
   * ```
   */
  static fromCache(options: {
    context: Context,
    vertexShaderSource: string | ShaderSource,
    fragmentShaderSource: string | ShaderSource,
    attributeLocations?: AttributeLocations,
  }) {
    return options.context.shaderCache.getShaderProgram(options);
  }

  /** @internal */
  _setUniforms(uniformMap: UniformMap, uniformState: UniformState, validate: boolean) {
    let len, i;

    if (defined(uniformMap)) {
      const manualUniforms = this._manualUniforms;
      len = manualUniforms.length;
      for (i = 0; i < len; i++) {
        const manualUniform = manualUniforms[i];
        const getUniform = uniformMap[manualUniform.name];
        if (!defined(getUniform)) {
          throw new DeveloperError(`No property named "${manualUniform.name}" in DrawCommand's uniformMap.`);
        }
        manualUniform.value = getUniform();
      }
    }

    const automaticUniforms = this._automaticUniforms;
    len = automaticUniforms.length;
    for (i = 0; i < len; i++) {
      const automaticUniform = automaticUniforms[i];
      automaticUniform.uniform.value = automaticUniform.automaticUniform.getValue(uniformState);
    }

    // It appears that assigning the uniform values above
    // and then setting them here (which makes the GL calls)
    // is faster than removing this loop and making the GL calls above.
    // I suspect this is because each GL call pollutes the L2 cache making our JavaScript and the browser/driver ping-pong cache lines.
    const uniforms = this._uniforms;
    len = uniforms.length;
    for (i = 0; i < len; i++) {
      uniforms[i].set();
    }

    if (validate) {

    }
  }

  isDestroyed() {
    return false;
  }

  destroy() {
    this._cachedShader.cache.releaseShaderProgram(this);
    return undefined;
  }

  finalDestroy() {
    this._gl.deleteProgram(this._program);
    return destroyObject(this);
  }
}

function initialize(shaderProgram: ShaderProgram) {
  if (defined(shaderProgram._program)) {
    return;
  }

  reinitialize(shaderProgram);
}

function reinitialize(shaderProgram: ShaderProgram) {
  const oldProgram = shaderProgram._program;

  const gl = shaderProgram._gl;
  const program = createAndLinkProgram(gl, shaderProgram, shaderProgram._debugShaders);

  const numberOfActiveAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  const uniforms = findUniforms(gl, program);
  const partitionedUniforms = partitionUniforms(shaderProgram, uniforms.uniformsByName)

  shaderProgram._program = program
  shaderProgram._numberOfVertexAttributes = numberOfActiveAttributes;
  shaderProgram._vertexAttributes = findVertexAttributes(gl, program, numberOfActiveAttributes);

  shaderProgram._uniformsByName = uniforms.uniformsByName;
  shaderProgram._uniforms = uniforms.uniforms;
  shaderProgram._automaticUniforms = partitionedUniforms.automaticUniforms;
  shaderProgram._manualUniforms = partitionedUniforms.manualUniforms;

  shaderProgram.maximumTextureUnitIndex = setSamplerUniforms(gl, program, uniforms.samplerUniforms);

  if (oldProgram) {
    shaderProgram._gl.deleteProgram(oldProgram);
  }
}

function createAndLinkProgram(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  shaderProgram: ShaderProgram,
  debugShaders: WEBGL_debug_shaders
): WebGLProgram {
  const vertexShaderText = shaderProgram._vertexShaderText;
  const fragmentShaderText = shaderProgram._fragmentShaderText;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderText);
  gl.compileShader(vertexShader);
  
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderText);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  const attributeLocations = shaderProgram._attributeLocations;
  if (defined(attributeLocations)) {
    for (const attribute in attributeLocations) {
      if (attributeLocations.hasOwnProperty(attribute)) {
        const location = attributeLocations[attribute];
        gl.bindAttribLocation(program, location, attribute);
      }
    }
  }

  gl.linkProgram(program);

  let log: string;
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const debugShaders = shaderProgram._debugShaders;

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      log = gl.getShaderInfoLog(fragmentShader);
      if (defined(debugShaders)) {
        const fragmentSourceTranslation = debugShaders.getTranslatedShaderSource(fragmentShader);
        if (fragmentSourceTranslation !== '') {
          console.error(`Translated fragment shader source:\n${fragmentSourceTranslation}`);
        } else {
          console.error(`Fragment shader translation failed.`);
        }
      }
      outputSurroundingSourceCode(log, fragmentShaderText, 'Failed to compile fragment shader: \n');
    }

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      log = gl.getShaderInfoLog(vertexShader);
      if (defined(debugShaders)) {
        const vertexSourceTranslation = debugShaders.getTranslatedShaderSource(vertexShader);
        if (vertexSourceTranslation !== '') {
          console.error(`Translated vertex shader source:\n${vertexSourceTranslation}`);
        } else {
          console.error(`Vertex shader translation failed.`);
        }
      }
      outputSurroundingSourceCode(log, vertexShaderText, 'Failed to compile vertex shader: \n');
    }

    log = gl.getProgramInfoLog(program);
    console.error(`Shader program link log: ${log}`);

    gl.deleteProgram(program);
    throw new Error();
  }

  const logShaderCompilation = shaderProgram._logShaderCompilation;
  if (logShaderCompilation) {
    log = gl.getShaderInfoLog(vertexShader);

    if (defined(log) && log.length > 0) {
      console.log(`Vertex shader compile log: ${log}`);;
    }

    log = gl.getShaderInfoLog(fragmentShader);
    if (defined(log) && log.length > 0) {
      console.log(`Fragment shader compile log: ${log}`);;
    }

    log = gl.getProgramInfoLog(program);
    if (defined(log) && log.length > 0) {
      console.log(`Shader program compile log: ${log}`);;
    }
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

function outputSurroundingSourceCode(shaderInfoLog: string, shaderSource: string, errorPrefix = ''): never {
  const infoLogs = shaderInfoLog.split('\n');
  const lines = shaderSource.split('\n');
  let lineNumberWidth = 0;

  const infoLogReg = /(WARNING|ERROR): ([0-9]*):(-?[0-9]*):(.*)/i;
  const extractedInfoLogs: {
    type: string,
    lineNumber: number,
    message: string,
  }[] = [];
  for (const infoLog of infoLogs) {
    const matches = infoLog.match(infoLogReg);
    if (matches && matches.length === 5) {
      extractedInfoLogs.push({
        type: matches[1],
        lineNumber: parseInt(matches[3]),
        message: matches[4],
      });
    }
  }

  // Get line number width
  let currentLineNumber = 0;
  const lineMarcoRegex = /^\s*#line\s+(-?\d+)/i;
  for (const line of lines) {

    const matchedLineMarco = line.match(lineMarcoRegex);
    if (matchedLineMarco && matchedLineMarco.length === 2) {
      currentLineNumber = parseInt(matchedLineMarco[1]);
    } else {
      ++currentLineNumber;
    }

    lineNumberWidth = Math.max(lineNumberWidth, currentLineNumber.toString().length);
  }

  currentLineNumber = 1;
  const preprocessedLines = [];
  const noErrorPrefix = ' '.repeat(4);
  const meetErrorPrefix = '=>'.padEnd(noErrorPrefix.length, ' ');
  const lineNumberWidthSpace = ' '.repeat(lineNumberWidth);
  for (const line of lines) {
    const matchedLineMarco = line.match(lineMarcoRegex);

    if (matchedLineMarco && matchedLineMarco.length === 2) {
      preprocessedLines.push(noErrorPrefix + lineNumberWidthSpace + ': ' + line);
      currentLineNumber = parseInt(matchedLineMarco[1]);
      continue;
    }


    const currentLineMeetInfoLogs = extractedInfoLogs.filter(infoLog => {
      const matched = infoLog.message.match(/'(.*)' :/);
      return (
        infoLog.lineNumber === currentLineNumber &&
        matched &&
        line.includes(matched[1])
      );
    });
    const meetInfoLogs = currentLineMeetInfoLogs.length > 0;
    if (meetInfoLogs) {
      preprocessedLines.push(currentLineMeetInfoLogs.map(infoLog => `${noErrorPrefix}${lineNumberWidthSpace}: ${infoLog.type}:${infoLog.message}`).join('\n'));
    }
    preprocessedLines.push((meetInfoLogs ? meetErrorPrefix : noErrorPrefix) + currentLineNumber.toString().padStart(lineNumberWidth, ' ') + ': ' + line);

    ++currentLineNumber;
  }

  throw new Error('\n' +
    errorPrefix +
    'Info Log:\n' +
    infoLogs.map(message => '\t' + message).join('\n') + '\n' +
    'Shader Source:\n' +
    preprocessedLines.join('\n')
  );
}

function findUniforms(gl: WebGLRenderingContext | WebGL2RenderingContext, program: WebGLProgram) {
  const uniformsByName: { [name: string]: Uniform | UniformArray } = {};
  const uniforms: (Uniform | UniformArray)[] = [];
  const samplerUniforms: (UniformSampler | UniformArraySampler)[] = [];

  const numberOfUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

  const suffix = '[0]';
  for (let i = 0; i < numberOfUniforms; i++) {
    const activeUniform = gl.getActiveUniform(program, i);
    /**
     * uniform name without brackets
     */
    const uniformName = activeUniform.name.includes(suffix)
      ? activeUniform.name.slice(0, activeUniform.name.length - suffix.length)
      : activeUniform.name;

    // Ignore GLSL built-in uniforms returned in Firefox
    if ( ! uniformName.startsWith('gl_') ) {
      if ( ! activeUniform.name.includes('[') ) {
        // Single uniform

        const location = gl.getUniformLocation(program, uniformName);
        if (location !== null) {
          const uniform = createUniform(
            gl,
            activeUniform,
            uniformName,
            location
          );

          uniformsByName[uniformName] = uniform;
          uniforms.push(uniform);

          if (uniform._setSampler) {
            samplerUniforms.push(uniform as UniformSampler);
          }
        }
      } else {
        // Uniform array

        let uniformArray: UniformArray, locations: WebGLUniformLocation[], loc: WebGLUniformLocation;

        // On some platforms - Nexus 4 in Firefox for one - an array of sampler2D ends up being represented
        // as separate uniforms, one for each array element.  Check for and handle that case.
        const indexOfBracket = uniformName.indexOf('[');
        if (indexOfBracket >= 0) {
          // We're assuming the array elements show up in numerical order - it seems to be true
          uniformArray = uniformsByName[uniformName.slice(0, indexOfBracket)] as UniformArraySampler;

          // Nexus 4 with Android 4.3 needs this check, because it reports a uniform
          // with the strange name webgl_3467e0265d05c3c1[1] in our globe surface shader.
          if (!defined(uniformArray)) {
            continue;
          }

          locations = (uniformArray as UniformArraySampler)._locations;

          // On the Nexus 4 in Chrome, we get one uniform per sampler, just like in Firefox,
          // but the size is not 1 like it is in Firefox.  So if we push locations here,
          // we'll end up adding too many locations.
          if (locations.length <= 1) {
            const value = uniformArray.value;
            loc = gl.getUniformLocation(program, uniformName);

            // Workaround for IE 11.0.9.  See above.
            if (loc !== null) {
              locations.push(loc);
              // TODO: push unit index as Texture?
              debugger;
              value.push(gl.getUniform(program, loc));
            }
          }
        } else {
          locations = [];
          for (let j = 0; j < activeUniform.size; j++) {
            loc = gl.getUniformLocation(program, `${uniformName}[${j}]`);

            // Workaround for IE 11.0.9.  See above.
            if (loc !== null) {
              locations.push(loc);
            }
          }

          uniformArray = createUniformArray(gl, activeUniform, uniformName, locations);
          uniformsByName[uniformName] = uniformArray;
          uniforms.push(uniformArray);

          if (uniformArray._setSampler) {
            samplerUniforms.push(uniformArray as UniformArraySampler);
          }
        }
      }
    }
  }

  return {
    uniformsByName: uniformsByName,
    uniforms: uniforms,
    samplerUniforms: samplerUniforms,
  };
}

function partitionUniforms(
  shaderProgram: ShaderProgram,
  uniformsByName: {
    [name: string]: Uniform | UniformArray,
  },
) {
  const automaticUniforms: {
    uniform: Uniform | UniformArray,
    automaticUniform: AutomaticUniform,
  }[] = [];
  const manualUniforms: (Uniform | UniformArray)[] = [];

  for (const uniform in uniformsByName) {
    if (uniformsByName.hasOwnProperty(uniform)) {
      const uniformObject = uniformsByName[uniform];
      const uniformName = uniform;

      const automaticUniform = AutomaticUniforms[uniformName];
      if (defined(automaticUniform)) {
        automaticUniforms.push({
          uniform: uniformObject,
          automaticUniform: automaticUniform,
        });
      } else {
        manualUniforms.push(uniformObject);
      }
    }
  }

  return {
    automaticUniforms: automaticUniforms,
    manualUniforms: manualUniforms,
  }
}

function findVertexAttributes(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  program: WebGLProgram,
  numberOfActiveAttributes: number
) {
  const attributes: {
    [name: string]: {
      name: string,
      type: number,
      index: number,
    }
  } = {};
  for (let i = 0; i < numberOfActiveAttributes; i++) {
    const attr = gl.getActiveAttrib(program, i);
    const location = gl.getAttribLocation(program, attr.name);

    attributes[attr.name] = {
      name: attr.name,
      type: attr.type,
      index: location,
    };
  }

  return attributes;
}

function setSamplerUniforms(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  program: WebGLProgram,
  samplerUniforms: (UniformSampler | UniformArraySampler)[]
): number {
  gl.useProgram(program);

  let textureUnitIndex = 0;
  const length = samplerUniforms.length;
  for (let i = 0; i < length; i++) {
    textureUnitIndex = samplerUniforms[i]._setSampler(textureUnitIndex);
  }

  gl.useProgram(null);

  return textureUnitIndex;
}

export default ShaderProgram;
