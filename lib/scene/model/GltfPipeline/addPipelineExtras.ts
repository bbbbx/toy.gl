import defaultValue from "../../../core/defaultValue";
import { glTF } from "../glTF";
import ForEach from "./ForEach";

/**
 * Add extras._pipeline property to object.
 * @param object 
 * @returns 
 * @internal
 */
function addExtras<T extends { extras? }>(object: T) : T {
  object.extras = defaultValue(object.extras, {});
  object.extras._pipeline = defaultValue(object.extras._pipeline, {});

  return object;
}

/**
 * Add extras._pipeline to gltf.buffers[n] and gltf.images[n]
 * @param gltf 
 * @returns 
 * @internal
 */
function addPipelineExtras(gltf: glTF) : glTF {
  // ForEach.shader(gltf, function (shader) {
  //   addExtras(shader);
  // });

  ForEach.buffer(gltf, function (buffer) {
    addExtras(buffer);
  });

  ForEach.image(gltf, function (image) {
    addExtras(image);
  });

  addExtras(gltf);

  return gltf;
}

export default addPipelineExtras;
