import sRGBToLinear from './functions/sRGBToLinear.glsl'
import UnitVectorToOctahedron from './functions/UnitVectorToOctahedron.glsl'
import OctahedronToUnitVector from './functions/OctahedronToUnitVector.glsl'
import GBufferData from './struct/GBufferData.glsl'

export default {
  toy_sRGBToLinear: sRGBToLinear,
  toy_UnitVectorToOctahedron: UnitVectorToOctahedron,
  toy_OctahedronToUnitVector: OctahedronToUnitVector,
  toy_GBufferData: GBufferData,
};
