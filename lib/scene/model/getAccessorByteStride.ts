import defined from "../../core/defined";
import getComponentDatatypeSizeInBytes from "../../core/getComponentDatatypeSizeInBytes";
import numberOfComponentsForType from "./numberOfComponentsForType";


function getAccessorByteStride(gltf, accessor) : number {
  const bufferViewIndex: number = accessor.bufferView;
  if (defined(bufferViewIndex)) {
    const bufferView = gltf.bufferViews[bufferViewIndex];
    if (defined(bufferView.byteStride) && bufferView.byteStride > 0) {
      return bufferView.byteStride;
    }
  }

  return getComponentDatatypeSizeInBytes(accessor.componentType) * numberOfComponentsForType(accessor.type);
}

export default getAccessorByteStride;
