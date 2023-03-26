import defined from "../../../core/defined";
import { glTF } from "../glTF";

function usesExtension(gltf: glTF, extension: string) : boolean {
  return (
    defined(gltf.extensionsUsed) &&
    gltf.extensionsUsed.includes(extension)
  );
}

export default usesExtension;
