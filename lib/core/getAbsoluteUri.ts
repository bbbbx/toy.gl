import Uri from "urijs";
import defaultValue from "./defaultValue";
import defined from "./defined";

function getAbsoluteUri(relative: string, base?: string) : string {
  let documentObject;
  if (typeof document !== 'undefined') {
    documentObject = document;
  }

  return getAbsoluteUri._implementation(relative, base, documentObject);
}

getAbsoluteUri._implementation = function (relative: string, base?: string, documentObject?: Document) {
  if (!defined(base)) {
    if (typeof documentObject === 'undefined') {
      return relative;
    }
    base = defaultValue(documentObject.baseURI, documentObject.location.href);
  }

  const relativeUri = new Uri(relative);

  if (relativeUri.scheme() !== '') {
    return relativeUri.toString();
  }
  return relativeUri.absoluteTo(base).toString();
};

export default getAbsoluteUri;
