import oneTimeWarning from "./oneTimeWarning";

function deprecationWarning(identifier: string, message: string) {
  oneTimeWarning(identifier, message);
}

export default deprecationWarning;
