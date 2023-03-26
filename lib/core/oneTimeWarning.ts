import defaultValue from "./defaultValue";
import defined from "./defined";

const warnings = {};

function oneTimeWarning(identifier: string, message: string) {
  if (!defined(warnings[identifier])) {
    warnings[identifier] = true;
    console.warn(defaultValue(message, identifier));
  }
}


export default oneTimeWarning;
