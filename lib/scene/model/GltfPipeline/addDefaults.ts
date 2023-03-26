import WebGLConstants from "../../../core/WebGLConstants";
import defaultValue from "../../../core/defaultValue";
import defined from "../../../core/defined";
import getAccessorByteStride from "../getAccessorByteStride";
import { TextureInfo, glTF } from "../glTF";
import ForEach from "./ForEach";
import addToArray from "./addToArray";

function addDefaults(gltf: glTF): glTF {
  ForEach.accessor(gltf, function (accessor) {
    if (defined(accessor.bufferView)) {
      accessor.byteOffset = defaultValue(accessor.byteOffset, 0);
    }
  });

  ForEach.bufferView(gltf, function (bufferView) {
    if (defined(bufferView.buffer)) {
      bufferView.byteOffset = defaultValue(bufferView.byteOffset, 0);
    }
  });

  ForEach.mesh(gltf, function (mesh) {
    ForEach.meshPrimitive(mesh, function (primitive) {
      primitive.mode = defaultValue(primitive.mode, WebGLConstants.TRIANGLES);

      if (!defined(primitive.material)) {
        if (!defined(gltf.materials)) {
          gltf.materials = [];
        }

        const defaultMaterial = {
          name: 'default'
        };

        primitive.material = addToArray(gltf.materials, defaultMaterial);
      }

    });
  });

  ForEach.accessorContainingVertexAttributeData(gltf, function (accessorIndex) {
    const accessor = gltf.accessors[accessorIndex];
    accessor.normalized = defaultValue(accessor.normalized, false);

    const bufferViewIndex = accessor.bufferView;
    if (defined(bufferViewIndex)) {
      const bufferView = gltf.bufferViews[bufferViewIndex];
      bufferView.byteStride = getAccessorByteStride(gltf, accessor);
      bufferView.target = WebGLConstants.ARRAY_BUFFER;
    }
  });

  ForEach.accessorContainingIndexData(gltf, function (accessorIndex) {
    const accessor = gltf.accessors[accessorIndex];
    const bufferViewIndex = accessor.bufferView;
    if (defined(bufferViewIndex)) {
      const bufferView = gltf.bufferViews[bufferViewIndex];
      bufferView.target = WebGLConstants.ELEMENT_ARRAY_BUFFER;
    }
  });

  ForEach.material(gltf, function (material) {
    material.emissiveFactor = defaultValue(material.emissiveFactor, [ 0.0, 0.0, 0.0 ]);
    material.doubleSided = defaultValue(material.doubleSided, false);
    material.alphaMode = defaultValue(material.alphaMode, 'OPAQUE');

    if (material.alphaMode === 'MASK') {
      material.alphaCutoff = defaultValue(material.alphaCutoff, 0.5);
    }

    addTextureInfoDefaults(material.emissiveTexture);
    addTextureInfoDefaults(material.normalTexture);
    addTextureInfoDefaults(material.occlusionTexture);

    const pbrMetallicRoughness = material.pbrMetallicRoughness;
    if (defined(pbrMetallicRoughness)) {
      pbrMetallicRoughness.baseColorFactor = defaultValue(pbrMetallicRoughness.baseColorFactor, [ 1.0, 1.0, 1.0, 1.0 ]);
      pbrMetallicRoughness.metallicFactor = defaultValue(pbrMetallicRoughness.metallicFactor, 1.0);
      pbrMetallicRoughness.roughnessFactor = defaultValue(pbrMetallicRoughness.roughnessFactor, 1.0);

      addTextureInfoDefaults(pbrMetallicRoughness.baseColorTexture);
      addTextureInfoDefaults(pbrMetallicRoughness.metallicRoughnessTexture);
    }

  });

  ForEach.animation(gltf, function (animation) {
    ForEach.animationSampler(animation, function (sampler) {
      sampler.interpolation = defaultValue(sampler.interpolation, 'LINEAR');
    });
  });

  const animationNodes = getAnimationNodes(gltf);
  ForEach.node(gltf, function (node, index) {
    const animated = defined(animationNodes[index]);
    if (
      animated ||
      defined(node.translation) ||
      defined(node.rotation) ||
      defined(node.scale)
    ) {
      node.translation = defaultValue(node.translation, [ 0.0, 0.0, 0.0 ]);
      node.rotation = defaultValue(node.rotation, [ 0.0, 0.0, 0.0, 1.0 ]);
      node.scale = defaultValue(node.scale, [ 1.0, 1.0, 1.0 ]);
    } else {
      node.matrix = defaultValue(node.matrix, [
        1.0, 0.0, 0.0, 0.0,
        0.0, 1.0, 0.0, 0.0,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
      ]);
    }
  });

  ForEach.sampler(gltf, function (sampler) {
    sampler.wrapS = defaultValue(sampler.wrapS, WebGLConstants.REPEAT);
    sampler.wrapT = defaultValue(sampler.wrapT, WebGLConstants.REPEAT);
  });

  if (defined(gltf.scenes) && !defined(gltf.scene)) {
    gltf.scene = 0;
  }

  return gltf;
}

function addTextureInfoDefaults(textureInfo: TextureInfo) {
  if (defined(textureInfo)) {
    textureInfo.texCoord = defaultValue(textureInfo.texCoord, 0);
  }
}

function getAnimationNodes(gltf: glTF) {
  const nodes: boolean[] = [];

  ForEach.animation(gltf, function (animation) {
    ForEach.animationChannel(animation, function (channel) {
      const target = channel.target;
      const nodeIndex = target.node;
      const path = target.path;
      // Ignore animations that target 'weights'
      if (path === 'translation' || path === 'rotation' || path === 'scale') {
        nodes[nodeIndex] = true;
      }
    });
  });

  return nodes;
}

export default addDefaults;
