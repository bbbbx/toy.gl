import defined from "../../../core/defined";
import { glTF } from "../glTF";
import ForEach from "./ForEach";

function removeExtras(object) {
  if (!defined(object.extras)) {
    return;
  }

  if (defined(object.extras._pipeline)) {
    delete object.extras._pipeline;
  }

  if (Object.keys(object.extras).length === 0) {
    delete object.extras;
  }
}

function removePipelineExtras(gltf: glTF) : glTF {
  // ForEach.shader()

  ForEach.buffer(gltf, function(buffer) {
    removeExtras(buffer);
  });

  ForEach.image(gltf, function(buffer) {
    removeExtras(buffer);
  });

  removeExtras(gltf);

  return gltf;
}

export default removePipelineExtras;
