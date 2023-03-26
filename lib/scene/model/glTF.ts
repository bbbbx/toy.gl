interface WithExtensions {
  extensions?,
}

interface WithExtras {
  extras?,
}

interface CameraOrthographic extends WithExtensions, WithExtras {
  xmag: number, // The floating-point horizontal magnification of the view. This value MUST NOT be equal to zero. This value SHOULD NOT be negative.
  ymag: number,
  zfar: number
  znear: number,
}
interface CameraPerspective extends WithExtensions, WithExtras {
  yfov: number,
  znear: number,
  zfar?: number,
  aspectRatio?: number,
}
interface Camera extends WithExtensions, WithExtras {
  type: string, // Specifies if the camera uses a perspective or orthographic projection.
  orthographic?: CameraOrthographic,
  perspective?: CameraPerspective,
  name?: string,
}

interface AnimationChannelTarget extends WithExtensions, WithExtras {
  path: "translation" | "rotation" | "scale" | "weights",
  node?: number,
}

interface AnimationChannel extends WithExtensions, WithExtras {
  sampler: number,
  target: AnimationChannelTarget,
}

interface AnimationSampler extends WithExtensions, WithExtras {
  input: number,  // The index of an accessor containing keyframe timestamps.
  output: number, // The index of an accessor, containing keyframe output values.
  interpolation?: "LINEAR" | "STEP" | "CUBICSPLINE",
}

interface Animation extends WithExtensions, WithExtras {
  channels: AnimationChannel[], // An array of animation channels. An animation channel combines an animation sampler with a target property being animated. Different channels of the same animation MUST NOT have the same targets.
  samplers: AnimationSampler[], // An array of animation samplers. An animation sampler combines timestamps with a sequence of output values and defines an interpolation algorithm.
  name?: string,
}

interface Skin extends WithExtensions, WithExtras {
  joints: number[],            // Indices of skeleton nodes, used as joints in this skin.
  skeleton: number,            // The index of the node used as a skeleton root.
  inverseBindMatrices: number, // The index of the accessor containing the floating-point 4x4 inverse-bind matrices.
  name?: string,
}

interface TextureInfo extends WithExtensions, WithExtras {
  index: number,
  texCoord?: number,
}

interface MaterialPbrMetallicRoughness extends WithExtensions, WithExtras {
  baseColorFactor?: [number, number, number, number],
  baseColorTexture?: TextureInfo,
  metallicFactor?: number,
  roughnessFactor?: number,
  metallicRoughnessTexture?: TextureInfo,
}

interface Material extends WithExtensions, WithExtras {
  name?: string,
  pbrMetallicRoughness?: MaterialPbrMetallicRoughness,
  normalTexture?: TextureInfo,
  occlusionTexture?: TextureInfo,
  emissiveFactor?: [number, number, number],
  emissiveTexture?: TextureInfo,
  alphaMode?: 'OPAQUE' | 'BLEND' | 'MASK'
  alphaCutoff?: number,
  doubleSided?: boolean,
}

interface Image extends WithExtensions, WithExtras {
  uri?: string,
  mimeType?: string,
  bufferView?: number,
  name?: string,
}

interface Sampler extends WithExtensions, WithExtras {
  wrapS?: number,
  wrapT?: number,
  minFilter?: number,
  magFilter?: number,
  name?: string,
}

interface Texture extends WithExtensions, WithExtras {
  sampler?: number,
  source?: number,
  name?: string,
}

interface Buffer extends WithExtensions, WithExtras {
  byteLength: number,
  uri?: string,
  name?: string,
}

interface BufferView extends WithExtensions, WithExtras {
  buffer: number,
  byteLength: number,
  byteOffset?: number,
  byteStride?: number,
  target?: number,
  name?: string,
}

interface AccessorSparseIndices extends WithExtensions, WithExtras  {
  bufferView: number,
  componentType: number,
  byteOffset?: number,
}
interface AccessorSparseValues extends WithExtensions, WithExtras {
  bufferView: number,
  byteOffset?: number,
}
interface AccessorSparse extends WithExtensions, WithExtras {
  count: number,
  indices: AccessorSparseIndices,
  values: AccessorSparseValues,
}

type AccessorType = 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4';
type AccessorMinMax = 
  [ number ] |
  [ number, number ] |
  [ number, number, number ] |
  [ number, number, number, number ] |
  [ number, number, number, number, number, number, number, number, number ] |
  [ number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number ];
interface Accessor extends WithExtensions, WithExtras {
  componentType: number,
  count: number,
  type: AccessorType
  bufferView?: number,
  byteOffset?: number,
  normalized?: boolean,
  min?: AccessorMinMax,
  max?: AccessorMinMax,
  name?: string,
  sparse?: AccessorSparse,
}

interface Attributes {
  [semantic: string]: number,
}

interface Primitive extends WithExtensions, WithExtras  {
  attributes: Attributes,
  indices?: number,
  material?: number,
  mode?: number,
  targets?: Attributes[],
}

interface Mesh extends WithExtensions, WithExtras {
  primitives: Primitive[],
  weights?: number[], // Array of weights to be applied to the morph targets. The number of array elements MUST match the number of morph targets.
  name?: string,
}

interface Node extends WithExtensions, WithExtras {
  children?: number[],
  name?: string,
  mesh?: number,
  skin?: number,
  matrix?: [ number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number ],
  translation?: [ number, number, number ],
  rotation?: [ number, number, number, number ],
  scale?: [ number, number, number ],
  weights?: number[],
  camera?: number,
}

interface Scene extends WithExtensions, WithExtras {
  nodes: number[],
  name?: string,
}

interface Asset extends WithExtensions, WithExtras {
  version: "1.0" | "2.0",
  minVersion?: "1.0" | "2.0",
  generator?: string,
  copyright?: string,
}

type glTF = {
  asset: Asset,
  scene?: number;
  scenes?: [ Scene, ...Scene[] ], // Type: scene[1-*], Required: No
  nodes?: Node[],
  meshes?: Mesh[],
  materials?: Material[],
  accessors?: Accessor[],
  bufferViews?: BufferView[],
  buffers?: Buffer[],
  textures?: Texture[],
  images?: Image[],
  samplers?: Sampler[],
  skins?: Skin[],
  animations?: Animation[],
  extensionsUsed?: string[],
  extensionsRequired?: string[],
  cameras?: Camera[],
} & WithExtensions & WithExtras;

interface KHRDracoMeshCompressionExtension extends WithExtensions, WithExtras {
  bufferView: number,
  attributes: Attributes,
}

export {
  glTF,
  Asset,
  Scene,
  Node,
  Animation,
  AnimationChannel,
  AnimationSampler,
  Mesh,
  Primitive,
  Attributes,
  Accessor,
  BufferView,
  Buffer,
  Material,
  Texture,
  TextureInfo,
  Image,
  Sampler,
  Camera,
  KHRDracoMeshCompressionExtension,
}
