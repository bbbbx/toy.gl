import DeveloperError from "../core/DeveloperError";
import defined from "../core/defined";
import ComponentDatatype from "../core/ComponentDatatype";
import Context from "./Context";
import defaultValue from "../core/defaultValue";
import Buffer from "./Buffer";
import destroyObject from "../core/destroyObject";
import ContextLimits from "./ContextLimits";

interface Attribute {
  index?: number,
  enabled?: boolean,
  value?: number[],
  vertexBuffer?: Buffer,
  offsetInBytes?: number,
  strideInBytes?: number,
  componentsPerAttribute: number,
  componentDatatype?: number,
  normalize?: boolean,
  instanceDivisor?: number,
}

interface VertexArrayAttribute {
  index: number
  enabled: boolean
  vertexBuffer: Buffer,
  value: number[]
  componentsPerAttribute: number,
  componentDatatype: number,
  normalize: boolean,
  offsetInBytes: number,
  strideInBytes: number,
  instanceDivisor: number,
  vertexAttrib: (gl: WebGLRenderingContext | WebGL2RenderingContext) => void,
  disableVertexAttribArray: (gl: WebGLRenderingContext | WebGL2RenderingContext) => void,
}

function addAttribute(attributes: VertexArrayAttribute[], attribute: Attribute, index: number, context: Context) {
  const hasVertexBuffer = defined(attribute.vertexBuffer)
  const hasValue = defined(attribute.value);
  const componentsPerAttribute = hasValue
    ? attribute.value.length
    : attribute.componentsPerAttribute;

  if (
    componentsPerAttribute !== 1 &&
    componentsPerAttribute !== 2 &&
    componentsPerAttribute !== 3 &&
    componentsPerAttribute !== 4
  ) {
    if (hasValue) {
      throw new DeveloperError('attribute.value.length must be in the range [1, 4].');
    }

    throw new DeveloperError('attribute.componentsPerAttribute must be in the range [1, 4].');
  }

  if (defined(attribute.componentDatatype) && !ComponentDatatype.validate(attribute.componentDatatype)) {
    throw new DeveloperError('attribute must have a valid componentDatatype or not specify it.');
  }

  if (
    defined(attribute.instanceDivisor) &&
    attribute.instanceDivisor > 0 &&
    !context.instancedArrays
  ) {
    throw new DeveloperError('instanced arrays is not supported');
  }
  if (defined(attribute.instanceDivisor) && attribute.instanceDivisor < 0) {
    throw new DeveloperError('attribute must have an instanceDivisor greater than or equal to zero');
  }
  if (defined(attribute.instanceDivisor) && hasValue) {
    throw new DeveloperError('attribute cannot have have an instanceDivisor if it is not backed by a buffer');
  }
  if (
    defined(attribute.instanceDivisor) &&
    attribute.instanceDivisor > 0 &&
    attribute.index === 0
  ) {
    throw new DeveloperError('attribute zero cannot have an instanceDivisor greater than 0');
  }

  // Shallow copy the attribute; we do not want to copy the vertex buffer.
  const attr : VertexArrayAttribute = {
    index: defaultValue(attribute.index, index) as number,
    enabled: defaultValue(attribute.enabled, true) as boolean,
    vertexBuffer: attribute.vertexBuffer,
    value: hasValue ? attribute.value.slice(0) : undefined,
    componentsPerAttribute: componentsPerAttribute,
    componentDatatype: defaultValue(attribute.componentDatatype, ComponentDatatype.FLOAT),
    normalize: defaultValue(attribute.normalize, false) as boolean,
    offsetInBytes: defaultValue(attribute.offsetInBytes, 0) as number,
    strideInBytes: defaultValue(attribute.strideInBytes, 0) as number,
    instanceDivisor: defaultValue(attribute.instanceDivisor, 0) as number,

    vertexAttrib: undefined,
    disableVertexAttribArray: undefined,
  };

  if (hasVertexBuffer) {
    // Common case: vertex buffer for per-vertex data
    attr.vertexAttrib = function(gl: WebGLRenderingContext | WebGL2RenderingContext) {
      const index = this.index;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer._getBuffer());
      gl.vertexAttribPointer(
        index,
        this.componentsPerAttribute,
        this.componentDatatype,
        this.normalize,
        this.strideInBytes,
        this.offsetInBytes
      );
      gl.enableVertexAttribArray(index);
      if (this.instanceDivisor > 0) {
        context.glVertexAttribDivisor(index, this.instanceDivisor);
        context._vertexAttribDivisor[index] = this.instanceDivisor;
        context._previousDrawInstanced = true;
      }
    };

    attr.disableVertexAttribArray = function(gl: WebGLRenderingContext | WebGL2RenderingContext) {
      gl.disableVertexAttribArray(this.index);
      if (this.instanceDivisor > 0) {
        context.glVertexAttribDivisor(index, 0);
      }
    };
  } else {
    // Less common case: value array for the same data for each vertex
    switch (attr.componentsPerAttribute) {
      case 1:
        attr.vertexAttrib = function(gl) {
          gl.vertexAttrib1fv(this.index, this.value);
        };
        break;
      case 2:
        attr.vertexAttrib = function(gl) {
          gl.vertexAttrib2fv(this.index, this.value);
        };
        break;
      case 3:
        attr.vertexAttrib = function(gl) {
          gl.vertexAttrib3fv(this.index, this.value);
        };
        break;
      case 4:
        attr.vertexAttrib = function(gl) {
          gl.vertexAttrib4fv(this.index, this.value);
        };
        break;
    };

    attr.disableVertexAttribArray = function(gl) {};
  }

  attributes.push(attr);
}

function bind(gl: WebGLRenderingContext | WebGL2RenderingContext, attributes: VertexArrayAttribute[], indexBuffer: Buffer) {
  const length = attributes.length;
  for (let i = 0; i < length; i++) {
    const attribute = attributes[i];
    if (attribute.enabled) {
      attribute.vertexAttrib(gl);
    }
  }

  if (defined(indexBuffer)) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer._getBuffer());
  }
}

// Workaround for ANGLE, where the attribute divisor seems to be part of the global state instead
// of the VAO state. This function is called when the vao is bound, and should be removed
// once the ANGLE issue is resolved. Setting the divisor should normally happen in vertexAttrib and
// disableVertexAttribArray.
function setVertexAttribDivisor(vertexArray: VertexArray) {
  const context = vertexArray._context;
  const hasInstancedAttributes = vertexArray._hasInstancedAttributes;
  if (!hasInstancedAttributes && !context._previousDrawInstanced) {
    return;
  }
  context._previousDrawInstanced = hasInstancedAttributes;

  const divisors = context._vertexAttribDivisor;
  const attributes = vertexArray._attributes;
  const maxAttributes = ContextLimits.maximumVertexAttributes;
  let i;

  if (hasInstancedAttributes) {
    const length = attributes.length
    for (i = 0; i < length; i++) {
      const attribute = attributes[i];
      if (attribute.enabled) {
        const divisor = attribute.instanceDivisor;
        const index = attribute.index;
        if (divisor !== divisors[index]) {
          context.glVertexAttribDivisor(index, divisor);
          divisor[index] = divisor;
        }
      }
    }
  } else {
    for (i = 0; i < maxAttributes; i++) {
      if (divisors[i] > 0) {
        context.glVertexAttribDivisor(i, 0);
        divisors[i] = 0;
      }
    }
  }
}

// Vertex attributes backed by a constant value go through vertexAttrib[1234]f[v]
// which is part of context state rather than VAO state.
function setConstantAttributes(vertexArray: VertexArray, gl: WebGLRenderingContext | WebGL2RenderingContext) {
  const attributes = vertexArray._attributes;
  const length = attributes.length;
  for (let i = 0; i < length; i++) {
    const attribute = attributes[i];
    if (attribute.enabled && defined(attribute.value)) {
      attribute.vertexAttrib(gl);
    }
  }
}

class VertexArray {
  _numberOfVertices: number;
  _hasInstancedAttributes: boolean;
  _hasConstantAttributes: boolean;
  _context: Context;
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _vao: WebGLVertexArrayObjectOES | WebGLVertexArrayObject;
  _attributes: VertexArrayAttribute[];
  _indexBuffer: Buffer;

  public get indexBuffer() : Buffer {
    return this._indexBuffer;
  }
  public get numberOfVertices() : number {
    return this._numberOfVertices;
  }

  /**
   * Create a vertex array, which defines the attributes making up a vertex, and contains an optional index buffer
   * to select vertices for rendering. Attributes are defined using object literals as shown in Example 1 below.
   * @param options 
   * 
   * @example
   * // Example 1: Create a vertex array with vertices made up of three floating point
   * // values, e.g., a position, from a single vertex buffer. No index buffer is used.
   * const positionBuffer = Buffer.createVertexBuffer({
   *   context: context,
   *   sizeInBytes: 12,
   *   usage: BufferUsage.STATIC_DRAW
   * });
   * const attributes = [
   *   {
   *     index                  : 0,
   *     enabled                : true,
   *     vertexBuffer           : positionBuffer,
   *     componentsPerAttribute : 3,
   *     componentDatatype      : ComponentDatatype.FLOAT,
   *     offsetInBytes          : 0,
   *     strideInBytes          : 0, // tightly packed
   *     instanceDivisor        : 0, // not instanced
   *   },
   * ];
   * const va = new VertexArray({
   *   context: context,
   *   attributes: attributes,
   * });
   * 
   * @example
   * // Example 2: Create a vertex array with vertices from two different vertex buffers.
   */
  constructor(options: {
    context: Context,
    attributes: Attribute[],
    indexBuffer: Buffer,
  }) {
    const context = options.context;
    const gl = context._gl;
    const attributes = options.attributes;
    const indexBuffer = options.indexBuffer;

    let i;
    const vaAttributes: VertexArrayAttribute[] = [];
    let numberOfVertices = 1; // if every attribute is backed by a single value
    let hasInstancedAttributes = false;
    let hasConstantAttributes = false;

    let length = attributes.length;
    for (i = 0; i < length; i++) {
      addAttribute(vaAttributes, attributes[i], i, context);
    }

    length = vaAttributes.length;
    for (i = 0; i < length; i++) {
      const vaAttribute = vaAttributes[i];

      if (defined(vaAttribute.vertexBuffer) && vaAttribute.instanceDivisor === 0) {
        // This assumes that each vertex buffer in the vertex array has the same number of vertices.
        const bytes =
          vaAttribute.strideInBytes ||
          vaAttribute.componentsPerAttribute * ComponentDatatype.getSizeInBytes(vaAttribute.componentDatatype);
        numberOfVertices = vaAttribute.vertexBuffer.sizeInBytes / bytes;
        break;
      }
    }

    for (i = 0; i < length; ++i) {
      if (vaAttributes[i].instanceDivisor > 0) {
        hasInstancedAttributes = true;
      }
      if (defined(vaAttributes[i].value)) {
        hasConstantAttributes = true;
      }
    }

    let vao;
    if (context.vertexArrayObject) {
      vao = context.glCreateVertexArray();
      context.glBindVertexArray(vao);
      bind(gl, vaAttributes, indexBuffer);
      context.glBindVertexArray(null);
    }

    this._numberOfVertices = numberOfVertices;
    this._hasInstancedAttributes = hasInstancedAttributes;
    this._hasConstantAttributes = hasConstantAttributes;
    this._context = context;
    this._gl = gl;
    this._vao = vao;
    this._attributes = vaAttributes;
    this._indexBuffer = indexBuffer;
  }

  public getAttribute(index: number) {
    return this._attributes[index];
  }

  public _bind() {
    if (defined(this._vao)) {
      this._context.glBindVertexArray(this._vao);
      if (this._context.instancedArrays) {
        setVertexAttribDivisor(this);
      }
      if (this._hasConstantAttributes) {
        setConstantAttributes(this, this._gl);
      }
    } else {
      bind(this._gl, this._attributes, this._indexBuffer);
    }
  }

  public _unBind() {
    if (defined(this._vao)) {
      this._context.glBindVertexArray(null);
    } else {
      const attributes = this._attributes;
      const gl = this._gl;

      for (let i = 0; i < attributes.length; i++) {
        const attribute = attributes[i];
        if (attribute.enabled) {
          attribute.disableVertexAttribArray(gl);
        }
      }
      if (this._indexBuffer) {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      }
    }
  }

  public isDestroyed() {
    return false;
  }

  public destroy() {
    const attributes = this._attributes;
    for (let i = 0; i < attributes.length; i++) {
      const vertexBuffer = attributes[i].vertexBuffer;
      if (
        defined(vertexBuffer) &&
        !vertexBuffer.isDestroyed() &&
        vertexBuffer.vertexArrayDestroyable
      ) {
        vertexBuffer.destroy();
      }
    }

    const indexBuffer = this._indexBuffer;
    if (
      defined(indexBuffer) &&
      !indexBuffer.isDestroyed() &&
      indexBuffer.vertexArrayDestroyable
    ) {
      indexBuffer.destroy();
    }

    if (defined(this._vao)) {
      this._context.glDeleteVertexArray(this._vao)
    }

    return destroyObject(this);
  }
}

export default VertexArray;