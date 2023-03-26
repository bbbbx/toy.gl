import clone from "../core/clone";
import defined from "../core/defined";
import Context from "./Context";
import ShaderDestination from "./ShaderDestination";
import ShaderProgram from "./ShaderProgram";
import ShaderSource from "./ShaderSource";

function includesVertexShader(destination: ShaderDestination) : boolean {
  return (
    destination === ShaderDestination.VERTEX ||
    destination === ShaderDestination.BOTH
  );
}

function includesFragmentShader(destination: ShaderDestination) : boolean {
  return (
    destination === ShaderDestination.FRAGMENT ||
    destination === ShaderDestination.BOTH
  );
}

type ShaderParts = {
  defineLines: string[],
  uniformLines: string[],
  shaderLines: string[],
  varyingLines: string[],
  // identifiers of structs/functions to include, listed in insertion order
  structIds: string[],
  functionIds: string[],
};

class ShaderStruct {
  name: string;
  fields: string[];
  constructor(name: string) {
    this.name = name;
    this.fields = [];
  }

  addField(type: string, identifier: string) {
    const field = `    ${type} ${identifier};`;
    this.fields.push(field);
  }

  generateGlslLines() : string[] {
    let fields = this.fields;
    if (this.fields.length === 0) {
      // GLSL requires structs to have at least one field
      fields = [ `    float _empty;` ];
    }

    return ([] as string[]).concat(`struct ${this.name}`, '{', fields, '};');
  }
}

class ShaderFunction {
  signature: string;
  body: string[];

  constructor(signature: string) {
    this.signature = signature;
    this.body = [];
  }

  addLines(lines: string | string[]) {
    const body = this.body;

    if (Array.isArray(lines)) {
      const length = lines.length;
      for (let i = 0; i < length; i++) {
        body.push(`    ${lines[i]}`);
      }
    } else {
      body.push(`    ${lines}`);
    }
  }

  generateGlslLines() : string[] {
    return ([] as string[]).concat(this.signature, '{', this.body, '}');
  }
}

class ShaderBuilder {
  _vertexShaderParts: ShaderParts;
  _fragmentShaderParts: ShaderParts;

  _structs: { [name: string] : ShaderStruct; };
  _functions: { [name: string] : ShaderFunction; };

  _attributeLocations: { [attributeName: string]: number };
  _attributeLines: string[];
  /**
   * Some WebGL implementations require attribute 0 to always
   * be active, so the position attribute is tracked separately
   */
  _positionAttributeLine: string;
  _nextAttributeLocation: number;

  constructor() {
    this._attributeLocations = {};
    this._attributeLines = [];
    this._nextAttributeLocation = 1;

    this._vertexShaderParts = {
      defineLines: [],
      structIds: [],
      varyingLines: [],
      uniformLines: [],
      shaderLines: [],
      functionIds: [],
    };
    this._fragmentShaderParts = {
      defineLines: [],
      structIds: [],
      varyingLines: [],
      uniformLines: [],
      shaderLines: [],
      functionIds: [],
    };
    this._structs = {};
    this._functions = {};
  }

  clone() : ShaderBuilder {
    return clone(this, true);
  }

  addDefine(identifier: string, value?: string, destination = ShaderDestination.BOTH) {
    const line = defined(value)
      ? `${identifier} ${value}`
      : `${identifier}`;

    if (includesVertexShader(destination)) {
      this._vertexShaderParts.defineLines.push(line);
    }

    if (includesFragmentShader(destination)) {
      this._fragmentShaderParts.defineLines.push(line);
    }
  }

  addAttribute(type: string, identifier: string) {
    const line = `in ${type} ${identifier};`;
    this._attributeLines.push(line);

    const location = this._nextAttributeLocation;
    this._attributeLocations[identifier] = location;

    // Most attributes only require a single attribute location, but matrices
    // require more.
    this._nextAttributeLocation += getAttributeLocationCount(type);
    return location;
  }

  setPositionAttribute(type: string, identifier: string) {
    this._positionAttributeLine = `in ${type} ${identifier};`;

    // Some WebGL implementations require attribute 0 to always be active, so
    // this builder assumes the position will always go in location 0
    this._attributeLocations[identifier] = 0;
    return 0;
  }

  addVarying(type: string, identifier: string) {
    const line = `${type} ${identifier};`;
    this._vertexShaderParts.varyingLines.push(`out ${line}`);
    this._fragmentShaderParts.varyingLines.push(`in ${line}`);
  }

  addUniform(type: string, identifier: string, destination: ShaderDestination = ShaderDestination.BOTH) {
    const line = `uniform ${type} ${identifier};`;

    if (destination === ShaderDestination.VERTEX || destination === ShaderDestination.BOTH) {
      this._vertexShaderParts.uniformLines.push(line);
    }
    if (destination === ShaderDestination.FRAGMENT || destination === ShaderDestination.BOTH) {
      this._fragmentShaderParts.uniformLines.push(line);
    }
  }

  addStruct(structId: string, structName: string, destination: ShaderDestination) {
    this._structs[structId] = new ShaderStruct(structName);

    if (includesVertexShader(destination)) {
      this._vertexShaderParts.structIds.push(structId);
    }

    if (includesFragmentShader(destination)) {
      this._fragmentShaderParts.structIds.push(structId);
    }
  }

  addStructField(structId: string, type: string, identifier: string) {
    this._structs[structId].addField(type, identifier);
  }

  addFunction(functionName: string, signature: string, destination: ShaderDestination) {
    this._functions[functionName] = new ShaderFunction(signature);

    if (includesVertexShader(destination)) {
      this._vertexShaderParts.functionIds.push(functionName);
    }

    if (includesFragmentShader(destination)) {
      this._fragmentShaderParts.functionIds.push(functionName);
    }
  }

  addFunctionLines(functionName: string, lines: string[] | string) {
    this._functions[functionName].addLines(lines);
  }

  addVertexLines(lines: string[] | string) {
    const vertexLines = this._vertexShaderParts.shaderLines;
    if (Array.isArray(lines)) {
      vertexLines.push.apply(vertexLines, lines);
    } else {
      // Single string case
      vertexLines.push(lines);
    }
  }

  addFragmentLines(lines: string[] | string) {
    const fragmentLines = this._fragmentShaderParts.shaderLines;
    if (Array.isArray(lines)) {
      fragmentLines.push.apply(fragmentLines, lines);
    } else {
      // Single string case
      fragmentLines.push(lines);
    }
  }

  buildShaderProgram(context: Context) {
    const positionAttribute = defined(this._positionAttributeLine)
      ? [this._positionAttributeLine]
      : [];

    const structLines = generateStructLines(this);
    const functionLines = generateFunctionLines(this);

    const vertexLines = positionAttribute
      .concat(
        this._attributeLines,
        this._vertexShaderParts.uniformLines,
        this._vertexShaderParts.varyingLines,
        structLines.vertexLines,
        functionLines.vertexLines,
        this._vertexShaderParts.shaderLines,
      )
      .join('\n');
    const vertexShaderSource = new ShaderSource({
      defines: this._vertexShaderParts.defineLines,
      sources: [vertexLines],
    });

    const fragmentLines = this._fragmentShaderParts.uniformLines
      .concat(
        this._fragmentShaderParts.varyingLines,
        structLines.fragmentLines,
        functionLines.fragmentLines,
        this._fragmentShaderParts.shaderLines,
      )
      .join('\n');
    const fragmentShaderSource = new ShaderSource({
      defines: this._fragmentShaderParts.defineLines,
      sources: [fragmentLines],
    });

    return ShaderProgram.fromCache({
      context: context,
      vertexShaderSource: vertexShaderSource,
      fragmentShaderSource: fragmentShaderSource,
      attributeLocations: this._attributeLocations,
    });
  }
}

function getAttributeLocationCount(glslType: string) : number {
  switch (glslType) {
    case "mat2":
      return 2;
    case "mat3":
      return 3;
    case "mat4":
      return 4;
    default:
      return 1;
  }
}

function generateStructLines(shaderBuilder: ShaderBuilder) {
  const vertexLines: string[] = [];
  const fragmentLines: string[] = [];

  let i: number,
      structId: string,
      struct: ShaderStruct,
      structLines: string[];

  const vsStructIds = shaderBuilder._vertexShaderParts.structIds;
  for (i = 0; i < vsStructIds.length; i++) {
    structId = vsStructIds[i];
    struct = shaderBuilder._structs[structId];
    structLines = struct.generateGlslLines();

    vertexLines.push(...structLines);
  }

  const fsStructIds = shaderBuilder._fragmentShaderParts.structIds;
  for (i = 0; i < fsStructIds.length; i++) {
    structId = fsStructIds[i];
    struct = shaderBuilder._structs[structId];
    structLines = struct.generateGlslLines();

    fragmentLines.push(...structLines);
  }

  return {
    vertexLines: vertexLines,
    fragmentLines: fragmentLines,
  };
}

function generateFunctionLines(shaderBuilder: ShaderBuilder) {
  const vertexLines: string[] = [];
  const fragmentLines: string[] = [];

  let functionIds = shaderBuilder._vertexShaderParts.functionIds;

  let i: number,
      functionId: string,
      shaderFunction: ShaderFunction,
      functionLines: string[];
  for (let i = 0; i < functionIds.length; i++) {
    functionId = functionIds[i];
    shaderFunction = shaderBuilder._functions[functionId];
    functionLines = shaderFunction.generateGlslLines();

    vertexLines.push(...functionLines);
  }

  functionIds = shaderBuilder._fragmentShaderParts.functionIds;
  for (let i = 0; i < functionIds.length; i++) {
    functionId = functionIds[i];
    shaderFunction = shaderBuilder._functions[functionId];
    functionLines = shaderFunction.generateGlslLines();

    fragmentLines.push(...functionLines);
  }

  return {
    vertexLines,
    fragmentLines
  };
}

export default ShaderBuilder;
