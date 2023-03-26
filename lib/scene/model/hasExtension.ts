import defined from "../../core/defined";

function hasExtension(json, extensionName: string) : boolean {
  return (
    defined(json) &&
    defined(json.extensions) &&
    defined(json.extensions[extensionName])
  );
}

export default hasExtension;
