import defined from "../../../core/defined";
import { Accessor, Animation, AnimationChannel, AnimationSampler, Attributes, Buffer, BufferView, Image, Material, Mesh, Node, Primitive, Sampler, glTF } from "../glTF";

namespace ForEach {
  export function objectLegacy<T>(
    objects?: T,
    handler?: (
      object: T[Extract<keyof T, string>],
      objectId: Extract<keyof T, string>
    ) => any
  ) {
    if (defined(objects)) {
      for (const objectId in objects) {
        if (Object.prototype.hasOwnProperty.call(objects, objectId)) {
          const object = objects[objectId];
          const value = handler(object, objectId);

          if (defined(value)) {
            return value
          }
        }
      }
    }
  }

  export function object<T>(arrayOfObjects?: T[], handler?: (object: T, i: number) => any) {
    if (defined(arrayOfObjects)) {
      const length = arrayOfObjects.length;
      for (let i = 0; i < length; i++) {
        const object = arrayOfObjects[i];
        const value = handler(object, i);

        if (defined(value)) {
          return value;
        }
      }
    }
  }

  export function topLevel(gltf: glTF, name: keyof glTF, handler: (object, i) => any) {
    const gltfProperty = gltf[name];

    if (defined(gltfProperty) && !Array.isArray(gltfProperty)) {
      return objectLegacy(gltfProperty, handler);
    }

    return object<any>(gltfProperty as any[], handler);
  }

  export function shader(gltf: glTF, handler) {

    // return ForEach.topLevel(gltf, 'shaders', handler);
  }

  export function buffer(gltf: glTF, handler: (buffer: Buffer, i: number) => any) {
    return ForEach.topLevel(gltf, 'buffers', handler);
  }

  export function bufferView(gltf: glTF, handler: (bufferView: BufferView, i: number) => any) {
    return ForEach.topLevel(gltf, 'bufferViews', handler);
  }

  export function image(gltf: glTF, handler: (image: Image, i: number) => any) {
    return ForEach.topLevel(gltf, 'images', handler);
  }

  export function accessor(gltf: glTF, handler: (accessor: Accessor, i: number) => any) {
    return topLevel(gltf, 'accessors', handler);
  }

  export function mesh<T>(gltf: glTF, handler: (mesh: Mesh, i: number) => T) {
    return topLevel(gltf, 'meshes', handler);
  }

  export function meshPrimitive<T>(mesh: Mesh, handler: (primitive: Primitive, i: number) => T) {
    const primitives = mesh.primitives;
    // primitives is required in mesh
    const primitivesLength = primitives.length;
    for (let i = 0; i < primitivesLength; i++) {
      const primitive = primitives[i];
      const value = handler(primitive, i);

      if (defined(value)) {
        return value;
      }
    }
  }

  export function meshPrimitiveAttribute<T>(primitive: Primitive, handler: (accessorIndex: number, semantic: string) => T) {
    const attributes = primitive.attributes;
    for (const semantic in attributes) {
      if (Object.prototype.hasOwnProperty.call(attributes, semantic)) {
        const value = handler(attributes[semantic], semantic);

        if (defined(value)) {
          return value;
        }
      }
    }
  }

  export function meshPrimitiveTarget(primitive: Primitive, handler: (target: Attributes, i: number) => any) {
    const targets = primitive.targets;
    if (defined(targets)) {
      const length = targets.length;
      for (let i = 0; i < length; i++) {
        const value = handler(targets[i], i);
        if (defined(value)) {
          return
        }
      }
    }
  }

  export function meshPrimitiveTargetAttribute(target: Attributes, handler: (accessorIndex: number, semantic: string) => any) {
    for (const semantic in target) {
      if (Object.prototype.hasOwnProperty.call(target, semantic)) {
        const accessorIndex = target[semantic];
        const value = handler(accessorIndex, semantic);
        if (defined(value)) {
          return
        }
      }
    }
  }

  export function material(gltf: glTF, handler: (material: Material, i: number) => any) {
    return topLevel(gltf, 'materials', handler);
  }

  export function node(gltf: glTF, handler: (node: Node, i: number) => any) {
    return topLevel(gltf, 'nodes', handler);
  }

  export function animation(gltf: glTF, handler: (animation: Animation, i: number) => any) {
    return topLevel(gltf, 'animations', handler);
  }

  export function animationChannel(animation: Animation, handler: (channel: AnimationChannel, i: number) => any) {
    return ForEach.object(animation.channels, handler);
  }

  export function animationSampler(animation: Animation, handler: (sampler: AnimationSampler, i: number) => any) {
    return ForEach.object(animation.samplers, handler);
  }

  export function sampler(gltf: glTF, handler: (sampler: Sampler, i: number) => any) {
    return topLevel(gltf, 'samplers', handler);
  }

  export function accessorContainingVertexAttributeData(gltf: glTF, handler: (accessorIndex: number) => any) {
    const visited = {};
    return ForEach.mesh(gltf, function (mesh) {

      return ForEach.meshPrimitive(mesh, function (primitive) {

        const valueForEach = ForEach.meshPrimitiveAttribute(primitive, function (accessorIndex, semantic) {
          if (!defined(visited[accessorIndex])) {
            visited[accessorIndex] = true;
            const value = handler(accessorIndex);

            if (defined(value)) {
              return value;
            }
          }
        }); // ForEach.meshPrimitiveAttribute

        if (defined(valueForEach)) {
          return valueForEach;
        }

        return ForEach.meshPrimitiveTarget(primitive, function (target) {

          return ForEach.meshPrimitiveTargetAttribute(target, function (accessorIndex) {
            if (!defined(visited[accessorIndex])) {
              visited[accessorIndex] = true;
              const value = handler(accessorIndex);

              if (defined(value)) {
                return value;
              }
            }
          }); // ForEach.meshPrimitiveTargetAttribute

        }); // ForEach.meshPrimitiveTarget

      }); // ForEach.meshPrimitive

    }); // ForEach.mesh
  }

  export function accessorContainingIndexData(gltf: glTF, handler: (accessorIndex: number) => any) {
    const visited = {};
    return ForEach.mesh(gltf, function (mesh) {

      ForEach.meshPrimitive(mesh, function (primitive) {

        const indices = primitive.indices;
        if (defined(indices) && !defined(visited[indices])) {
          visited[indices] = true;
          const value = handler(indices);

          if (defined(value)) {
            return value;
          }
        }

      }); // ForEach.meshPrimitive

    }); // ForEach.mesh
  }
}

export default ForEach;