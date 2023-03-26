import ComponentDatatype from "../../core/ComponentDatatype";
import PrimitiveType from "../../core/PrimitiveType";
import IndexDatatype from "../../core/IndexDatatype";
import Cartesian2 from "../../math/Cartesian2";
import Cartesian3 from "../../math/Cartesian3";
import Cartesian4 from "../../math/Cartesian4";
import Matrix2 from "../../math/Matrix2";
import Matrix3 from "../../math/Matrix3";
import Matrix4 from "../../math/Matrix4";
import Quaternion from "../../math/Quaternion";
import Texture from "../../renderer/Texture";
import Buffer from "../../renderer/Buffer";
import AlphaMode from "./AlphaMode";
import VertexAttributeSemantic from "./VertexAttributeSemantic";
import AttributeType from "./AttributeType";
import Axis from "../Axis";

class TextureReader {
  index: number;
  texCoord: number;
  texture: Texture;
  transform: Matrix3;
  channels: string;

  constructor() {
    this.texCoord = 0;
    this.transform = Matrix3.clone(Matrix3.IDENTITY);
  }
}

class MetallicRoughness {
  static DEFAULT_BASE_COLOR_FACTOR = Cartesian4.ONE;
  static DEFAULT_METALLIC_FACTOR = 1.0;
  static DEFAULT_ROUGHNESS_FACTOR = 1.0;

  baseColorTexture: TextureReader;
  baseColorFactor: Cartesian4;

  metallicRoughnessTexture: TextureReader;
  metallicFactor: number;
  roughnessFactor: number;

  constructor() {
    this.baseColorFactor = MetallicRoughness.DEFAULT_BASE_COLOR_FACTOR;
    this.metallicFactor = MetallicRoughness.DEFAULT_METALLIC_FACTOR;
    this.roughnessFactor = MetallicRoughness.DEFAULT_ROUGHNESS_FACTOR;
  }
}

class EmissiveStrength {
  emissiveStrength: number;
  static DEFAULT_EMISSIVE_STRENGTH = 1.0;

  constructor() {
    this.emissiveStrength = EmissiveStrength.DEFAULT_EMISSIVE_STRENGTH;
  }
}

class Specular {
  specularFactor: number;              // The strength of the specular reflection.	
  specularTexture: TextureReader;      // A texture that defines the strength of the specular reflection, stored in the alpha (A) channel. This will be multiplied by specularFactor.
  specularColorFactor: Cartesian3;     // The F0 color of the specular reflection (linear RGB).
  specularColorTexture: TextureReader; // A texture that defines the F0 color of the specular reflection, stored in the RGB channels and encoded in sRGB. This texture will be multiplied by specularColorFactor.

  static DEFAULT_SPECULAR_FACTOR = 1.0;
  static DEFAULT_SPECULAR_COLOR_FACTOR = Cartesian3.ONE;

  constructor() {
    this.specularFactor = Specular.DEFAULT_SPECULAR_FACTOR;
    this.specularColorFactor = Specular.DEFAULT_SPECULAR_COLOR_FACTOR;
  }
}

class Clearcoat {
  clearcoatFactor: number;
  clearcoatTexture: TextureReader;
  clearcoatRoughnessFactor: number;
  clearcoatRoughnessTexture: TextureReader;
  clearcoatNormalTexture: TextureReader;

  static DEFAULT_CLEARCOAT_FACTOR = 0.0;
  static DEFAULT_CLEARCOAT_ROUGHNESS_FACTOR = 0.0;

  constructor() {
    this.clearcoatFactor = Clearcoat.DEFAULT_CLEARCOAT_FACTOR;
    this.clearcoatRoughnessFactor = Clearcoat.DEFAULT_CLEARCOAT_ROUGHNESS_FACTOR;
  }
}

class Material {
  static DEFAULT_EMISSIVE_FACTOR = Cartesian3.ZERO;

  metallicRoughness: MetallicRoughness;

  normalTexture: TextureReader;

  emissiveTexture: TextureReader;
  emissiveFactor: Cartesian3;

  occlusionTexture: TextureReader;

  alphaMode: AlphaMode;
  alphaCutoff: number;
  doubleSided: boolean;

  emissiveStrength : EmissiveStrength; // KHR_materials_emissive_strength
  specular: Specular;                  // KHR_materials_specular
  clearcoat: Clearcoat;                // KHR_materials_clearcoat

  constructor() {
    this.metallicRoughness = new MetallicRoughness();

    this.emissiveFactor = Material.DEFAULT_EMISSIVE_FACTOR;

    this.alphaMode = AlphaMode.OPAQUE;
    this.alphaCutoff = 0.5;
    this.doubleSided = false;
  }
}

class Indices {
  indexDatatype: IndexDatatype;
  count: number;
  buffer: Buffer;
  typedArray: Uint8Array | Uint16Array | Uint32Array;

  constructor() {}
}

class Quantization {
  constructor() {}
}

class Attribute {
  name: string;
  semantic: VertexAttributeSemantic;
  setIndex?: number;
  componentDatatype: ComponentDatatype;
  type: AttributeType;
  normalized: boolean;
  count: number;
  min: number | Cartesian2 | Cartesian3 | Cartesian4 | Matrix2 | Matrix3 | Matrix4;
  max: number | Cartesian2 | Cartesian3 | Cartesian4 | Matrix2 | Matrix3 | Matrix4;
  constant: number | Cartesian2 | Cartesian3 | Cartesian4 | Matrix2 | Matrix3 | Matrix4;
  // quantization: Quantization;
  typedArray: Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array;
  buffer: Buffer;
  byteOffset: number;
  byteStride: number;

  constructor() {
    this.byteOffset = 0;
  }
}

class Primitive {
  material: Material;
  attributes: Attribute[];
  indices: Indices;
  primitiveType: PrimitiveType;
  // morphTargets: MorphTarget[];
  // featureIds;

  constructor() {
    this.attributes = [];
  }
}

class Instances {
  attributes: Attribute[]
  featureIds: [];
  transformInWorldSpace: boolean;
  constructor() {
    this.attributes = [];
    this.featureIds = [];
    this.transformInWorldSpace = false;
  }
}

class Skin {
  index: number;
  joints: Node[];
  inverseBindMatrices: Matrix4[];
  constructor() {
    this.joints = [];
    this.inverseBindMatrices = [];
  }
}

enum InterpolationType {
  STEP = 0,
  LINEAR = 1,
  CUBICSPLINE = 2,
}

class AnimationSampler {
  input: number[];
  interpolation: InterpolationType;
  output: number[] | Cartesian3[] | Quaternion[];
  constructor() {
    this.input = [];
    this.output = [];
  }
}
enum AnimatedPropertyType {
  TRANSLATION = 'translation',
  ROTATION = 'rotation',
  SCALE = 'scale',
  WEIGHTS = 'weights',
}
class AnimationTarget {
  node: Node;
  path: AnimatedPropertyType;
  constructor() {}
}
class AnimationChannel {
  sampler: AnimationSampler;
  target: AnimationTarget;
  constructor() {}
}
class Animation {
  name: string;
  samplers: AnimationSampler[];
  channels: AnimationChannel[];
  constructor() {
    this.samplers = [];
    this.channels = [];
  }
}

class Node {
  name: string;
  index: number;
  children: Node[];
  primitives: Primitive[];
  instances: Instances;
  skin: Skin;
  matrix: Matrix4;
  translation: Cartesian3;
  rotation: Quaternion;
  scale: Cartesian3;
  morphWeights: number[];

  constructor() {
    this.children = [];
    this.primitives = [];
    this.morphWeights = [];
  }
}

class Asset {
  credits: [];
  constructor() {
    this.credits = [];
  }
}

class Scene {
  nodes: Node[];
  constructor() {
    this.nodes = [];
  }
}

class Components {
  asset: Asset;
  scene?: Scene;
  nodes: Node[];
  skins: Skin[];
  animations: Animation[];
  transform: Matrix4;

  upAxis?: Axis;
  forwardAxis?: Axis;

  constructor() {
    this.asset = new Asset()
    this.nodes = [];
    this.skins = [];
    this.animations = [];
    this.transform = Matrix4.clone(Matrix4.IDENTITY);
  }
}

export {
  Components,
  Node,
  Scene,
  Instances,
  Primitive,
  Attribute,
  Indices,
  Material,
  MetallicRoughness,
  EmissiveStrength,
  Specular,
  Clearcoat,
  TextureReader,
};
