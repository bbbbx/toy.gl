import DeveloperError from "../core/DeveloperError";
import defaultValue from "../core/defaultValue";
import defined from "../core/defined";
import Context from "./Context";
import demodernizeShader from "./demodernizeShader";
import Builtins from "../shaders/builtin";
import AutomaticUniforms from "./AutomaticUniforms";

function removeComments(shaderText: string) : string {
  // remove inline comments
  shaderText = shaderText.replace(/\/\/.*/g, '');
  // remove multiline comment block
  return shaderText.replace(/\/\*\*[\s\S]*?\*\//gm, function (match) {
    // preserve the number of lines in the comment block so the line numbers will be correct when debugging shaders
    const numberOfLines = match.match(/\n/gm).length;
    let replacement = '';
    for (let lineNumber = 0; lineNumber < numberOfLines; ++lineNumber) {
      replacement += '\n';
    }
    return replacement;
  });
}

const builtinsAndUniforms: {
  [name: string]: string
} = {};
for (const builtinName in Builtins) {
  if (Builtins.hasOwnProperty(builtinName)) {
    builtinsAndUniforms[builtinName] = Builtins[builtinName];
  }
}
for (const uniformName in AutomaticUniforms) {
  if (AutomaticUniforms.hasOwnProperty(uniformName)) {
    const uniform = AutomaticUniforms[uniformName];
    builtinsAndUniforms[uniformName] = uniform.getDeclaration(uniformName);
  }
}

type DependencyNode = {
  name: string;
  glslSource: string;
  dependsOn: DependencyNode[];
  requiredBy: DependencyNode[];
  evaluated: boolean;
};

function getDependencyNode(name: string, glslSource: string, nodes: DependencyNode[]) {
  let dependencyNode: DependencyNode;

  // Check if already loaded
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].name === name) {
      dependencyNode = nodes[i];
    }
  }

  if (!defined(dependencyNode)) {
    // Strip doc comments so we don't accidentally try to determine a dependency for something found
    // in a comment
    glslSource = removeComments(glslSource);

    dependencyNode = {
      name: name,
      glslSource: glslSource,
      dependsOn: [],
      requiredBy: [],
      evaluated: false,
    };

    nodes.push(dependencyNode);
  }

  return dependencyNode;
}

function generateDependencies(currentNode: DependencyNode, dependencyNodes: DependencyNode[]) {
  if (currentNode.evaluated) {
    return;
  }

  currentNode.evaluated = true;

  // Identify all dependencies that are referenced from this glsl source code
  let dependentBuiltinNames: string[] = currentNode.glslSource.match(/\btoy_[a-zA-Z0-9_]*/g);

  if (!defined(dependentBuiltinNames)) {
    return;
  }

  // Remove duplicates name
  dependentBuiltinNames = dependentBuiltinNames.filter(function (name, i) {
    return dependentBuiltinNames.indexOf(name) === i;
  });

  dependentBuiltinNames.forEach(function (builtinName) {
    if (
      builtinName !== currentNode.name &&
      builtinsAndUniforms.hasOwnProperty(builtinName)
    ) {
      const referenceGlslSource = builtinsAndUniforms[builtinName];
      const referenceNode = getDependencyNode(builtinName, referenceGlslSource, dependencyNodes);

      currentNode.dependsOn.push(referenceNode);
      referenceNode.requiredBy.push(currentNode);

      // Recursive call to find any dependencies of the new node
      generateDependencies(referenceNode, dependencyNodes);
    }
  });
}

function sortDependencies(dependencyNodes: DependencyNode[]) {
  const nodesWithoutIncomingEdges: DependencyNode[] = [];
  const allNodes: DependencyNode[] = [];

  while (dependencyNodes.length > 0) {
    const node = dependencyNodes.pop();
    allNodes.push(node);

    if (node.requiredBy.length === 0) {
      nodesWithoutIncomingEdges.push(node);
    }
  }

  while (nodesWithoutIncomingEdges.length > 0) {
    const currentNode = nodesWithoutIncomingEdges.shift();

    dependencyNodes.push(currentNode);

    for (let i = 0; i < currentNode.dependsOn.length; i++) {
      // Remove the edge from the graph
      const referenceNode = currentNode.dependsOn[i];
      const index = referenceNode.requiredBy.indexOf(currentNode);
      referenceNode.requiredBy.splice(index, 1);

      // If referenced node has no more incoming edges, add to list
      if (referenceNode.requiredBy.length === 0) {
        nodesWithoutIncomingEdges.push(referenceNode);
      }
    }
  }

  // If there are any nodes left with incoming edge, then there was a circular dependency somewhere in the graph
  const badNodes: DependencyNode[] = [];
  for (let j = 0; j < allNodes.length; j++) {
    if (allNodes[j].requiredBy.length !== 0) {
      badNodes.push(allNodes[j]);
    }
  }

  if (badNodes.length !== 0) {
    let message = 'A circular dependency was found in the following built-in function/struct/constants:\n';
    for (let k = 0; k < badNodes.length; k++) {
      message += `${badNodes[k].name}\n`;
    }
    throw new DeveloperError(message);
  }
}

function getBuiltinsAndAutomaticUniforms(shaderSource: string) {
  // Generate a dependency graph for builtin functions
  const dependencyNodes: DependencyNode[] = [];
  const root: DependencyNode = getDependencyNode('main', shaderSource, dependencyNodes);
  generateDependencies(root, dependencyNodes);
  sortDependencies(dependencyNodes);

  // Concatenate the source code for the function dependencies.
  // Iterate in reverse so that dependent items are declared before they are used.
  let builtinsSource = '';
  for (let i = dependencyNodes.length - 1; i >= 0; i--) {
    builtinsSource += `${dependencyNodes[i].glslSource}\n`;
  }

  return builtinsSource.replace(root.glslSource, '');
}

/**
 * @public
 */
class ShaderSource {
  sources: string[];
  defines: string[];
  includeBuiltIns: boolean;

  constructor(options: {
    sources?: string[],
    defines?: string[],
    includeBuiltIns?: boolean,
  }) {
    this.sources = defaultValue(options.sources?.slice(0), []);
    this.defines = defaultValue(options.defines?.slice(0), []);
    this.includeBuiltIns = defaultValue(options.includeBuiltIns, true);
  }

  /** @internal */
  public createCombinedVertexShader(context: Context): string {
    return combineShader(this, false, context);
  }

  /** @internal */
  public createCombinedFragmentShader(context: Context): string {
    return combineShader(this, true, context);
  }

  /**
   * @internal
   * @returns 
   */
  public getCacheKey() : string {
    const sortedDefines = this.defines.slice().sort();
    const definesKey = sortedDefines.join(',');

    const sourcesKey = this.sources.join('\n');
    const builtinsKey = this.includeBuiltIns;

    return `${definesKey}:${builtinsKey}:${sourcesKey}`;
  }
}

function combineShader(
  shaderSource: ShaderSource,
  isFragmentShader: boolean,
  context: Context
) : string {
  let i;
  let length;

  let combinedSources = '';
  const sources = shaderSource.sources;
  if (defined(sources)) {
    for (i = 0, length = sources.length; i < length; i++) {
      combinedSources += `\n#line 0\n${sources[i]}`;
    }
  }

  combinedSources = removeComments(combinedSources);

  // Extract existing shader version from sources
  let version;
  combinedSources = combinedSources.replace(/#version\s+(.*?)\n/gm, function (match, group1) {
    if (defined(version) && version !== group1) {
      throw new DeveloperError(`inconsistent versions found: ${version} and ${group1}`);
    }

    // Extract #version to put at the top
    version = group1;

    // Replace original #version directive with a new line so the line numbers
    // are not off by one. There can be only one #version directive
    // and it must appear at the top of the source, only preceded by
    // whitespace and comments.
    return '\n';
  });

  // Extract shader extensions from sources
  const extensions = [];
  combinedSources = combinedSources.replace(/#extension.*\n/gm, function (match) {
    // Extract extensions to put at the top
    extensions.push(match);

    // Replace original #extension directive with a new line so the line numbers
    // are not off by one.
    return '\n';
  });

  // Remove precision qualifier
  combinedSources = combinedSources.replace(/precision\s(lowp|mediump|highp)\s(float|int);/, '');

  // Replace main() for picked if desired
  // const pickColorQualifier = shaderSource.pickColorQualifier;
  // if (defined(pickColorQualifier)) {
  //   combinedSources = ShaderSource.createPickFragmentShaderSource(combinedSources, pickColorQualifier);
  // }

  // Combine into single string
  let result = '';

  const extensionsLength = extensions.length;
  for (i = 0; i < extensionsLength; i++) {
    result += extensions[i];
  }

  if (isFragmentShader) {
    result += `#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  precision highp int;
  precision highp samplerCube;
  ${context.webgl2 ? 'precision highp sampler3D;' : ''}
  ${context.webgl2 ? 'precision highp sampler2DArray;' : ''}
#else
  precision mediump float;
  precision mediump int;
  precision mediump samplerCube;
  ${context.webgl2 ? 'precision mediump sampler3D;' : ''}
  ${context.webgl2 ? 'precision mediump sampler2DArray;' : ''}
  #define highp mediump
#endif
`;
  }

  // Prepend #defines for user-shaders
  const defines = shaderSource.defines;
  if (defined(defines)) {
    for (i = 0, length = defines.length; i < length; i++) {
      const define = defines[i];
      if (define.length !== 0) {
        result += `#define ${define}\n`;
      }
    }
  }

  // Define a constant for the OES_texture_float extension since WebGL does not.
  if (context.floatingPointTexture) {
    result += '#define OES_texture_float\n\n';
  }

  // Append built-ins
  let builtinSources = '';
  if (shaderSource.includeBuiltIns) {
    builtinSources = getBuiltinsAndAutomaticUniforms(combinedSources);
  }

  // Reset line number
  result += '\n#line 0\n';

  const combinedShader = builtinSources + combinedSources;
  if (
    context.webgl2 &&
    isFragmentShader &&
    !/layout\s*\(location\s*=\s*0\)\s*out\s+vec4\s+(\w+);/g.test(combinedShader)
  ) {
    result += 'layout (location = 0) out vec4 out_FragColor;\n\n';
  }

  result += combinedShader;

  if (!context.webgl2) {
    result = demodernizeShader(result, isFragmentShader);
  } else {
    result = `#version 300 es\n${result}`;
  }

  return result;
}

export default ShaderSource;
