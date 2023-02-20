import Cartesian2 from "../math/Cartesian2";
import Cartesian3 from "../math/Cartesian3";
import Cartesian4 from "../math/Cartesian4";
import Color from "../core/Color";
import Matrix2 from "../math/Matrix2";
import Matrix3 from "../math/Matrix3";
import Matrix4 from "../math/Matrix4";
import Texture from "./Texture";
import CubeMap from "./CubeMap";
import Texture3D from "./Texture3D";

/**
 * @public
 * See {@link DrawCommand.uniformMap}.
 */
type UniformMap = {
  [uniformName: string]: () =>
    number |
    Cartesian2 |
    Cartesian3 |
    Cartesian4 |
    Color |
    Matrix2 |
    Matrix3 |
    Matrix4 |
    Texture |
    CubeMap |
    Texture3D |
    number[] |
    Cartesian2[] |
    Cartesian3[] |
    Cartesian4[] |
    Color[] |
    Matrix2[] |
    Matrix3[] |
    Matrix4[] |
    Texture[] |
    CubeMap[] |
    Texture3D[],
}

export {
  UniformMap,
};
