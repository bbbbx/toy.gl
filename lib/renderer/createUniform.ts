import DeveloperError from "../core/DeveloperError";
import defined from "../core/defined";
import Color from "../core/Color";
import Cartesian2 from "../math/Cartesian2";
import Cartesian3 from "../math/Cartesian3";
import Cartesian4 from "../math/Cartesian4";
import Matrix2 from "../math/Matrix2";
import Matrix3 from "../math/Matrix3";
import Matrix4 from "../math/Matrix4";
import Texture from "./Texture";
import CubeMap from "./CubeMap";
import Texture3D from "./Texture3D";
import Texture2DArray from "./Texture2DArray";

function createUniform(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  activeUniform: WebGLActiveInfo,
  uniformName: string,
  location: WebGLUniformLocation
): Uniform {
  switch (activeUniform.type) {
    case gl.FLOAT:
      return new UniformFloat(gl, activeUniform, uniformName, location);
    case gl.FLOAT_VEC2:
      return new UniformFloatVec2(gl, activeUniform, uniformName, location);
    case gl.FLOAT_VEC3:
      return new UniformFloatVec3(gl, activeUniform, uniformName, location);
    case gl.FLOAT_VEC4:
      return new UniformFloatVec4(gl, activeUniform, uniformName, location);
    case gl.SAMPLER_2D:
    case gl.SAMPLER_CUBE:
    case (gl as WebGL2RenderingContext).SAMPLER_3D:
    case (gl as WebGL2RenderingContext).SAMPLER_2D_ARRAY:
      return new UniformSampler(gl, activeUniform, uniformName, location);
    case gl.INT:
    case gl.BOOL:
      return new UniformInt(gl, activeUniform, uniformName, location);
    case gl.INT_VEC2:
    case gl.BOOL_VEC2:
      return new UniformIntVec2(gl, activeUniform, uniformName, location);
    case gl.INT_VEC3:
    case gl.BOOL_VEC3:
      return new UniformIntVec3(gl, activeUniform, uniformName, location);
    case gl.INT_VEC4:
    case gl.BOOL_VEC4:
      return new UniformIntVec4(gl, activeUniform, uniformName, location);
      case gl.FLOAT_MAT2:
      return new UniformMat2(gl, activeUniform, uniformName, location);
      case gl.FLOAT_MAT3:
      return new UniformMat3(gl, activeUniform, uniformName, location);
      case gl.FLOAT_MAT4:
      return new UniformMat4(gl, activeUniform, uniformName, location);
    default:
      throw new Error(`Unrecognized uniform type: ${activeUniform.type} for uniform "${uniformName}".`);
  }
}

interface Uniform {
  // Only available for UniformSampler
  _setSampler?(textureUnitIndex: number): number;
}
////////////////////////////////////////////////////////////
abstract class Uniform {
  name: string;
  value: number | Cartesian2 | Cartesian3 | Cartesian4 | Color | Matrix2 | Matrix3 | Matrix4 | Texture | CubeMap | Texture3D | Texture2DArray;
  _value: number | Cartesian2 | Cartesian3 | Cartesian4 | Color | Matrix2 | Matrix3 | Matrix4;
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _location: WebGLUniformLocation;

  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    this.name = uniformName

    this._gl = gl;
    this._location = location;
  }

  abstract set(): void;
}
////////////////////////////////////////////////////////////
class UniformFloat extends Uniform {
  value: number;
  _value: number;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this._value = 0.0;
  }

  set(): void {
    if (this.value !== this._value) {
      this._value = this.value;
      this._gl.uniform1f(this._location, this.value);
    }
  }
}
////////////////////////////////////////////////////////////
class UniformFloatVec2 extends Uniform {
  value: Cartesian2;
  _value: Cartesian2;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this._value = new Cartesian2();
  }

  set(): void {
    const v = this.value;
    if (!Cartesian2.equals(v, this._value)) {
      Cartesian2.clone(v, this._value);
      this._gl.uniform2f(this._location, v.x, v.y);
    }
  }
}
////////////////////////////////////////////////////////////
class UniformFloatVec3 extends Uniform {
  value: Cartesian3 | Color;
  _value: Cartesian3 | Color;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this._value = undefined;
  }

  set(): void {
    const v = this.value;

    if (defined((v as Color).red)) {
      if (!Color.equals(v as Color, this._value as Color)) {
        this._value = Color.clone(v as Color, this._value as Color);
        this._gl.uniform3f(this._location, (v as Color).red, (v as Color).green, (v as Color).blue);
      }
    } else if (defined((v as Cartesian3).x)) {
      if (!Cartesian3.equals(v as Cartesian3, this._value as Cartesian3)) {
        this._value = Cartesian3.clone(v as Cartesian3, this._value as Cartesian3);
        this._gl.uniform3f(this._location, (v as Cartesian3).x, (v as Cartesian3).y, (v as Cartesian3).z);
      }
    } else {
      throw new DeveloperError(`Invalid vec3 value for uniform "${this.name}".`);
    }
  }
}
////////////////////////////////////////////////////////////
class UniformFloatVec4 extends Uniform {
  value: Cartesian4 | Color;
  _value: Cartesian4 | Color;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this._value = undefined;
  }

  set(): void {
    const v = this.value;

    if (defined((v as Color).red)) {
      if (!Color.equals(v as Color, this._value as Color)) {
        this._value = Color.clone(v as Color, this._value as Color);
        this._gl.uniform4f(this._location, (v as Color).red, (v as Color).green, (v as Color).blue, (v as Color).alpha);
      }
    } else if (defined((v as Cartesian4).x)) {
      if (!Cartesian4.equals(v as Cartesian4, this._value as Cartesian4)) {
        this._value = Cartesian4.clone(v as Cartesian4, this._value as Cartesian4);
        this._gl.uniform4f(this._location, (v as Cartesian4).x, (v as Cartesian4).y, (v as Cartesian4).z, (v as Cartesian4).w);
      }
    } else {
      throw new DeveloperError(`Invalid vec4 value for uniform "${this.name}".`);
    }
  }
}
////////////////////////////////////////////////////////////
class UniformSampler extends Uniform {
  value: Texture | CubeMap | Texture3D | Texture2DArray;
  textureUnitIndex: number;

  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this.textureUnitIndex = undefined;
  }

  set(): void {
    const gl = this._gl;
    gl.activeTexture(gl.TEXTURE0 + this.textureUnitIndex);

    const v = this.value;
    gl.bindTexture(v._target, v._texture);
  }

  _setSampler(textureUnitIndex: number): number {
    this.textureUnitIndex = textureUnitIndex;
    this._gl.uniform1i(this._location, textureUnitIndex);
    return textureUnitIndex + 1;
  }
}
////////////////////////////////////////////////////////////
class UniformInt extends Uniform {
  value: number;
  _value: number;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this._value = 0.0;
  }

  set(): void {
    if (this.value !== this._value) {
      this._value = this.value;
      this._gl.uniform1i(this._location, this.value);
    }
  }
}
////////////////////////////////////////////////////////////
class UniformIntVec2 extends Uniform {
  value: Cartesian2;
  _value: Cartesian2;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this._value = new Cartesian2();
  }

  set(): void {
    const v = this.value;
    if (!Cartesian2.equals(v, this._value)) {
      Cartesian2.clone(v, this._value);
      this._gl.uniform2i(this._location, v.x, v.y);
    }
  }
}
////////////////////////////////////////////////////////////
class UniformIntVec3 extends Uniform {
  value: Cartesian3;
  _value: Cartesian3;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this._value = new Cartesian3();
  }

  set(): void {
    const v = this.value;
    if (!Cartesian3.equals(v, this._value)) {
      Cartesian3.clone(v, this._value);
      this._gl.uniform3i(this._location, v.x, v.y, v.z);
    }
  }
}
////////////////////////////////////////////////////////////
class UniformIntVec4 extends Uniform {
  value: Cartesian4;
  _value: Cartesian4;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this._value = new Cartesian4();
  }

  set(): void {
    const v = this.value;
    if (!Cartesian4.equals(v, this._value)) {
      Cartesian4.clone(v, this._value);
      this._gl.uniform4i(this._location, v.x, v.y, v.z, v.w);
    }
  }
}
////////////////////////////////////////////////////////////
const scratchUniformArray: Float32Array = new Float32Array(4);

class UniformMat2 extends Uniform {
  value: Matrix2;
  _value: Matrix2;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this._value = new Matrix2();
  }

  set(): void {
    if (!Matrix2.equalsArray(this.value, this._value as unknown as number[], 0)) {
      Matrix2.clone(this.value, this._value);
  
      const array = Matrix2.toArray(this.value, scratchUniformArray as unknown as number[]);
      this._gl.uniformMatrix2fv(this._location, false, array);
    }
  }
}
////////////////////////////////////////////////////////////
const scratchMat3Array = new Float32Array(9);

class UniformMat3 extends Uniform {
  value: Matrix3;
  _value: Matrix3;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this._value = new Matrix3();
  }

  set(): void {
    if (!Matrix3.equalsArray(this.value, this._value as unknown as number[], 0)) {
      Matrix3.clone(this.value, this._value);
  
      const array = Matrix3.toArray(this.value, scratchMat3Array as unknown as number[]);
      this._gl.uniformMatrix3fv(this._location, false, array);
    }
  }
}
////////////////////////////////////////////////////////////
const scratchMat4Array = new Float32Array(16);

class UniformMat4 extends Uniform {
  value: Matrix4;
  _value: Matrix4;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    location: WebGLUniformLocation
  ) {
    super(gl, activeUniform, uniformName, location);
    this.value = undefined;
    this._value = new Matrix4();
  }

  set(): void {
    if (!Matrix4.equalsArray(this.value, this._value as unknown as number[], 0)) {
      Matrix4.clone(this.value, this._value);
  
      const array = Matrix4.toArray(this.value, scratchMat4Array as unknown as number[]);
      this._gl.uniformMatrix4fv(this._location, false, array);
    }
  }
}

export {
  Uniform,
  UniformSampler,
  createUniform,
};