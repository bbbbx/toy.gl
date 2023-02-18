import Color from "../core/Color";
import DeveloperError from "../core/DeveloperError";
import RuntimeError from "../core/RuntimeError";
import defined from "../core/defined";
import Cartesian2 from "../math/Cartesian2";
import Cartesian3 from "../math/Cartesian3";
import Cartesian4 from "../math/Cartesian4";
import Matrix2 from "../math/Matrix2";
import Matrix3 from "../math/Matrix3";
import Matrix4 from "../math/Matrix4";
import CubeMap from "./CubeMap";
import Texture from "./Texture";

function createUniformArray(
  gl: WebGLRenderingContext | WebGL2RenderingContext,
  activeUniform: WebGLActiveInfo,
  uniformName: string,
  locations: WebGLUniformLocation[]
): UniformArray {
  switch (activeUniform.type) {
    case gl.FLOAT:
      return new UniformArrayFloat(gl, activeUniform, uniformName, locations);
    case gl.FLOAT_VEC2:
      return new UniformArrayFloatVec2(gl, activeUniform, uniformName, locations);
    case gl.FLOAT_VEC3:
      return new UniformArrayFloatVec3(gl, activeUniform, uniformName, locations);
    case gl.FLOAT_VEC4:
      return new UniformArrayFloatVec4(gl, activeUniform, uniformName, locations);
    case gl.SAMPLER_2D:
    case gl.SAMPLER_CUBE:
      return new UniformArraySampler(gl, activeUniform, uniformName, locations);
    case gl.INT:
    case gl.BOOL:
      return new UniformArrayInt(gl, activeUniform, uniformName, locations);
    case gl.INT_VEC2:
    case gl.BOOL_VEC2:
      return new UniformArrayIntVec2(gl, activeUniform, uniformName, locations);
    case gl.INT_VEC3:
    case gl.BOOL_VEC3:
      return new UniformArrayIntVec3(gl, activeUniform, uniformName, locations);
    case gl.INT_VEC4:
    case gl.BOOL_VEC4:
      return new UniformArrayIntVec4(gl, activeUniform, uniformName, locations);
    case gl.FLOAT_MAT2:
      return new UniformArrayMat2(gl, activeUniform, uniformName, locations);
    case gl.FLOAT_MAT3:
      return new UniformArrayMat3(gl, activeUniform, uniformName, locations);
    case gl.FLOAT_MAT4:
      return new UniformArrayMat4(gl, activeUniform, uniformName, locations);
    default:
      throw new RuntimeError(`Unrecognized uniform type: ${activeUniform.type} for uniform "${uniformName}".`);
  }
}


interface UniformArray {
  // Only available for UniformArraySampler
  _setSampler?(textureUnitIndex: number): number;
}
///////////////////////////////////////////////////////////////////////////
abstract class UniformArray {
  name: string;
  value: number[] | Cartesian2[] | Cartesian3[] | Cartesian4[] | Color[] | Matrix2[] | Matrix3[] | Matrix4[] | Texture[] | CubeMap[];
  _value: number[] | Int32Array | Float32Array | Texture[] | CubeMap[];
  _gl: WebGLRenderingContext | WebGL2RenderingContext;
  _location: WebGLUniformLocation;

  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    this.name = uniformName

    this._gl = gl;
    this._location = locations[0];
  }

  abstract set(): void;
}
///////////////////////////////////////////////////////////////////////////
class UniformArrayFloat extends UniformArray {
  value: number[];
  _value: Float32Array;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Float32Array(length);
  }

  set(): void {
    const value = this.value;
    const length = value.length;
    const arrayBuffer = this._value;
    let changed = false;

    for (let i = 0; i < length; i++) {
      const v = value[i];

      if (arrayBuffer[i] !== v) {
        arrayBuffer[i] = v;
        changed = true;
      }
    }

    if (changed) {
      this._gl.uniform1fv(this._location, arrayBuffer);
    }
  }
}
///////////////////////////////////////////////////////////////////////////
class UniformArrayFloatVec2 extends UniformArray {
  value: Cartesian2[];
  _value: Float32Array;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Float32Array(length * 2);
  }

  set(): void {
    const value = this.value;
    const length = value.length;
    const arraybuffer = this._value;
    let changed = false;
    let j = 0;

    for (let i = 0; i < length; ++i) {
      const v = value[i];

      if (!Cartesian2.equalsArray(v, arraybuffer as unknown as number[], j)) {
        Cartesian2.pack(v, arraybuffer as unknown as number[], j);
        changed = true;
      }
      j += 2;
    }

    if (changed) {
      this._gl.uniform2fv(this._location, arraybuffer);
    }
  }
}
///////////////////////////////////////////////////////////////////////////
class UniformArrayFloatVec3 extends UniformArray {
  value: Cartesian3[] | Color[];
  _value: Float32Array;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Float32Array(length * 3);
  }

  set(): void {
    const value = this.value;
    const length = value.length;
    const arraybuffer = this._value;
    let changed = false;
    let j = 0;

    for (let i = 0; i < length; ++i) {
      const v = value[i];

      if (defined((v as Color).red)) {
        if (
          (v as Color).red !== arraybuffer[j] ||
          (v as Color).green !== arraybuffer[j + 1] ||
          (v as Color).blue !== arraybuffer[j + 2]
        ) {
          arraybuffer[j] = (v as Color).red;
          arraybuffer[j + 1] = (v as Color).green;
          arraybuffer[j + 2] = (v as Color).blue;
          changed = true;
        }
      } else if (defined((v as Cartesian3).x)) {
        if (!Cartesian3.equalsArray(v as Cartesian3, arraybuffer as unknown as number[], j)) {
          Cartesian3.pack(v as Cartesian3, arraybuffer as unknown as number[], j);
          changed = true;
        }
      } else {
        throw new DeveloperError('Invalid vec3 value.');
      }

      j += 3;
    }

    if (changed) {
      this._gl.uniform3fv(this._location, arraybuffer);
    }
  }
}
///////////////////////////////////////////////////////////////////////////
class UniformArrayFloatVec4 extends UniformArray {
  value: Cartesian4[] | Color[];
  _value: Float32Array;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Float32Array(length * 4);
  }

  set(): void {
    const value = this.value;
    const length = value.length;
    const arraybuffer = this._value;
    let changed = false;
    let j = 0;

    for (let i = 0; i < length; ++i) {
      const v = value[i];

      if (defined((v as Color).red)) {
        if (Color.equalsArray((v as Color), arraybuffer as unknown as number[], j)) {
          Color.pack((v as Color), arraybuffer as unknown as number[], j);
          changed = true;
        }
      } else if (defined((v as Cartesian4).x)) {
        if (!Cartesian4.equalsArray(v as Cartesian4, arraybuffer as unknown as number[], j)) {
          Cartesian4.pack(v as Cartesian4, arraybuffer as unknown as number[], j);
          changed = true;
        }
      } else {
        throw new DeveloperError('Invalid vec4 value.');
      }

      j += 4;
    }

    if (changed) {
      this._gl.uniform4fv(this._location, arraybuffer);
    }
  }
}
///////////////////////////////////////////////////////////////////////////
class UniformArraySampler extends UniformArray {
  value: Texture[] | CubeMap[];
  _value: Float32Array;
  _locations: WebGLUniformLocation[];
  textureUnitIndex: number;

  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Float32Array();
    this._locations = locations;
    this.textureUnitIndex = undefined;
  }

  set(): void {
    const gl = this._gl;
    const textureUnitIndex = gl.TEXTURE0 + this.textureUnitIndex;

    const value = this.value;
    const length = value.length;
    for (let i = 0; i < length; i++) {
      const v = value[i];
      gl.activeTexture(textureUnitIndex + i);
      gl.bindTexture(v._target, v._texture);
    }
  }

  /**
   * 
   * @param textureUnitIndex -
   * @returns 
   */
  _setSampler(textureUnitIndex: number) : number {
    this.textureUnitIndex = textureUnitIndex;

    const locations = this._locations;
    const length = locations.length
    for (let i = 0; i < length; i++) {
      const index = textureUnitIndex + i;
      this._gl.uniform1i(locations[i], index);
    }

    return textureUnitIndex + length;
  }
}
///////////////////////////////////////////////////////////////////////////
class UniformArrayInt extends UniformArray {
  value: number[];
  _value: Int32Array;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Int32Array(length);
  }

  set(): void {
    const value = this.value;
    const length = value.length;
    const arrayBuffer = this._value;
    let changed = false;

    for (let i = 0; i < length; i++) {
      const v = value[i];

      if (arrayBuffer[i] !== v) {
        arrayBuffer[i] = v;
        changed = true;
      }
    }

    if (changed) {
      this._gl.uniform1iv(this._location, arrayBuffer);
    }
  }
}
///////////////////////////////////////////////////////////////////////////
class UniformArrayIntVec2 extends UniformArray {
  value: Cartesian2[];
  _value: Int32Array;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Int32Array(length * 2);
  }

  set(): void {
    const value = this.value;
    const length = value.length;
    const arraybuffer = this._value;
    let changed = false;
    let j = 0;

    for (let i = 0; i < length; ++i) {
      const v = value[i];

      if (!Cartesian2.equalsArray(v, arraybuffer as unknown as number[], j)) {
        Cartesian2.pack(v, arraybuffer as unknown as number[], j);
        changed = true;
      }
      j += 2;
    }

    if (changed) {
      this._gl.uniform2iv(this._location, arraybuffer);
    }
  }
}
///////////////////////////////////////////////////////////////////////////
class UniformArrayIntVec3 extends UniformArray {
  value: Cartesian3[];
  _value: Int32Array;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Int32Array(length * 3);
  }

  set(): void {
    const value = this.value;
    const length = value.length;
    const arraybuffer = this._value;
    let changed = false;
    let j = 0;

    for (let i = 0; i < length; ++i) {
      const v = value[i];

      if (!Cartesian3.equalsArray(v, arraybuffer as unknown as number[], j)) {
        Cartesian3.pack(v, arraybuffer as unknown as number[], j);
        changed = true;
      }

      j += 3;
    }

    if (changed) {
      this._gl.uniform3iv(this._location, arraybuffer);
    }
  }
}
///////////////////////////////////////////////////////////////////////////
class UniformArrayIntVec4 extends UniformArray {
  value: Cartesian4[];
  _value: Int32Array;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Int32Array(length * 4);
  }

  set(): void {
    const value = this.value;
    const length = value.length;
    const arraybuffer = this._value;
    let changed = false;
    let j = 0;

    for (let i = 0; i < length; ++i) {
      const v = value[i];

      if (!Cartesian4.equalsArray(v, arraybuffer as unknown as number[], j)) {
        Cartesian4.pack(v, arraybuffer as unknown as number[], j);
        changed = true;
      }

      j += 4;
    }

    if (changed) {
      this._gl.uniform4iv(this._location, arraybuffer);
    }
  }
}
///////////////////////////////////////////////////////////////////////////
class UniformArrayMat2 extends UniformArray {
  value: Matrix2[];
  _value: Float32Array;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Float32Array(length * 4);
  }

  set(): void {
    const value = this.value;
    const length = value.length;
    const arraybuffer = this._value;
    let changed = false;
    let j = 0;

    for (let i = 0; i < length; ++i) {
      const v = value[i];

      if (!Matrix2.equalsArray(v, arraybuffer as unknown as number[], j)) {
        Matrix2.pack(v, arraybuffer as unknown as number[], j);
        changed = true;
      }
      j += 4;
    }

    if (changed) {
      this._gl.uniformMatrix2fv(this._location, false, arraybuffer);
    }
  }
}
///////////////////////////////////////////////////////////////////////////
class UniformArrayMat3 extends UniformArray {
  value: Matrix3[];
  _value: Float32Array;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Float32Array(length * 9);
  }

  set(): void {
    const value = this.value;
    const length = value.length;
    const arraybuffer = this._value;
    let changed = false;
    let j = 0;

    for (let i = 0; i < length; ++i) {
      const v = value[i];

      if (!Matrix3.equalsArray(v, arraybuffer as unknown as number[], j)) {
        Matrix3.pack(v, arraybuffer as unknown as number[], j);
        changed = true;
      }
      j += 9;
    }

    if (changed) {
      this._gl.uniformMatrix3fv(this._location, false, arraybuffer);
    }
  }
}
///////////////////////////////////////////////////////////////////////////
class UniformArrayMat4 extends UniformArray {
  value: Matrix4[];
  _value: Float32Array;
  constructor(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    activeUniform: WebGLActiveInfo,
    uniformName: string,
    locations: WebGLUniformLocation[]
  ) {
    super(gl, activeUniform, uniformName, locations);

    const length = locations.length;
    this.value = new Array(length);
    this._value = new Float32Array(length * 16);
  }

  set(): void {
    const value = this.value;
    const length = value.length;
    const arraybuffer = this._value;
    let changed = false;
    let j = 0;

    for (let i = 0; i < length; ++i) {
      const v = value[i];

      if (!Matrix4.equalsArray(v, arraybuffer as unknown as number[], j)) {
        Matrix4.pack(v, arraybuffer as unknown as number[], j);
        changed = true;
      }
      j += 16;
    }

    if (changed) {
      this._gl.uniformMatrix4fv(this._location, false, arraybuffer);
    }
  }
}

export {
  UniformArray,
  UniformArraySampler,
  createUniformArray,
};
