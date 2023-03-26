import WebGLConstants from "../core/WebGLConstants";
import { UniformMap } from "./IDrawCommand";
import UniformState from "./UniformState";

const datatypeToGlsl = {
  [WebGLConstants.FLOAT]: 'float',
  [WebGLConstants.FLOAT_VEC2]: 'vec2',
  [WebGLConstants.FLOAT_VEC3]: 'vec3',
  [WebGLConstants.FLOAT_VEC4]: 'vec4',
  [WebGLConstants.FLOAT_MAT2]: 'mat2',
  [WebGLConstants.FLOAT_MAT3]: 'mat3',
  [WebGLConstants.FLOAT_MAT4]: 'mat4',
  [WebGLConstants.INT]: 'int',
  [WebGLConstants.INT_VEC2]: 'ivec2',
  [WebGLConstants.INT_VEC3]: 'ivec3',
  [WebGLConstants.INT_VEC4]: 'ivec4',
  [WebGLConstants.BOOL]: 'bool',
  [WebGLConstants.BOOL_VEC2]: 'bvec2',
  [WebGLConstants.BOOL_VEC3]: 'bvec3',
  [WebGLConstants.BOOL_VEC4]: 'bvec4',
  [WebGLConstants.SAMPLER_2D]: 'sampler2D',
  [WebGLConstants.SAMPLER_CUBE]: 'samplerCube',
  [WebGLConstants.SAMPLER_3D]: 'sampler3D',
};
type Datatype = keyof (typeof datatypeToGlsl);

class AutomaticUniform {
  _size: number;
  _datatype: Datatype
  getValue: (uniformState: UniformState) => ReturnType<UniformMap[keyof UniformMap]>

  constructor(options: {
    size: number,
    datatype: Datatype,
    getValue: (uniformState: UniformState) => ReturnType<UniformMap[keyof UniformMap]>,
  }) {
    this._size = options.size;
    this._datatype = options.datatype;
    this.getValue = options.getValue;
  }

  getDeclaration(name: string) {
    let declaration = `uniform ${datatypeToGlsl[this._datatype]} ${name}`;

    const size = this._size;
    if (size > 1) {
      declaration += `[${size.toString()}]`;
    }

    declaration += ';';

    return declaration;
  }
}

export default AutomaticUniform;
