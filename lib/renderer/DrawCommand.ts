import defaultValue from "../core/defaultValue";
import Context from "./Context";
import Framebuffer from "./Framebuffer";
import PrimitiveType from "../core/PrimitiveType";
import RenderState from "./RenderState";
import ShaderProgram from "./ShaderProgram";
import VertexArray from "./VertexArray";

interface UniformMap {
  [name: string]: () => void,
}

/**
 * @public
 */
class DrawCommand {
  _vertexArray: VertexArray;
  _count: number;
  _offset: number;
  _instanceCount: number;
  _shaderProgram: ShaderProgram;
  _uniformMap: UniformMap;
  _renderState: RenderState;
  _framebuffer: Framebuffer;
  _primitiveType: PrimitiveType;
  _owner: any;

  dirty: boolean;
  lastDirtyTime: number;

  constructor(options: {
    vertexArray?: VertexArray,
    count?: number,
    offset?: number,
    instanceCount?: number,
    shaderProgram?: ShaderProgram,
    framebuffer?: Framebuffer,
    uniformMap?: UniformMap,
    renderState?: RenderState,
    primitiveType?: PrimitiveType,
    owner?: any,
  } = defaultValue.EMPTY_OBJECT) {
    this._vertexArray = options.vertexArray;
    this._count = options.count;
    this._offset = defaultValue(options.offset, 0);
    this._instanceCount = defaultValue(options.instanceCount, 0);
    this._shaderProgram = options.shaderProgram;
    this._framebuffer = options.framebuffer;
    this._uniformMap = options.uniformMap;
    this._renderState = options.renderState;
    this._primitiveType = defaultValue(options.primitiveType, PrimitiveType.TRIANGLES);
    this._owner = options.owner;

    this.dirty = true;
    this.lastDirtyTime = 0;
  }

  public execute(context: Context, passState?) {
    context.draw(this, passState);
  }

  public get primitiveType() : PrimitiveType {
    return this._primitiveType;
  }
  public set primitiveType(value : PrimitiveType) {
    if (this._primitiveType !== value) {
      this._primitiveType = value;
      this.dirty = true;
    }
  }

  public get vertexArray() : VertexArray {
    return this._vertexArray;
  }
  public set vertexArray(value : VertexArray) {
    if (this._vertexArray !== value) {
      this._vertexArray = value;
      this.dirty = true;
    }
  }

  public get count() : number {
    return this._count;
  }
  public set count(value : number) {
    if (this._count !== value) {
      this._count = value;
      this.dirty = true;
    }
  }

  public get offset() : number {
    return this._count;
  }
  public set offset(value : number) {
    if (this._offset !== value) {
      this._offset = value;
      this.dirty = true;
    }
  }

  public get instanceCount() : number {
    return this._instanceCount;
  }
  public set instanceCount(value : number) {
    if (this._instanceCount !== value) {
      this._instanceCount = value;
      this.dirty = true;
    }
  }

  public get shaderProgram() : ShaderProgram {
    return this._shaderProgram;
  }
  public set shaderProgram(value : ShaderProgram) {
    if (this._shaderProgram !== value) {
      this._shaderProgram = value;
      this.dirty = true;
    }
  }

  public get uniformMap() : UniformMap {
    return this._uniformMap;
  }
  public set uniformMap(value : UniformMap) {
    if (this._uniformMap !== value) {
      this._uniformMap = value;
      this.dirty = true;
    }
  }

  public get renderState() : RenderState {
    return this._renderState;
  }
  public set renderState(value : RenderState) {
    if (this._renderState !== value) {
      this._renderState = value;
      this.dirty = true;
    }
  }

  public get framebuffer() : Framebuffer {
    return this._framebuffer;
  }
  public set framebuffer(value : Framebuffer) {
    if (this._framebuffer !== value) {
      this._framebuffer = value;
      this.dirty = true;
    }
  }

  public get owner() : any {
    return this._owner;
  }
  public set owner(value : any) {
    if (this._owner !== value) {
      this._owner = value;
      this.dirty = true;
    }
  }
}

export default DrawCommand;
