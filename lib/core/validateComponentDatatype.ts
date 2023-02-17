import ComponentDatatype from "./ComponentDatatype";
import defined from "./defined";

function validateComponentDatatype(componentDatatype: ComponentDatatype) : boolean {
  return (
    defined(componentDatatype) &&
    (componentDatatype === ComponentDatatype.BYTE ||
      componentDatatype === ComponentDatatype.UNSIGNED_BYTE ||
      componentDatatype === ComponentDatatype.SHORT ||
      componentDatatype === ComponentDatatype.UNSIGNED_SHORT ||
      componentDatatype === ComponentDatatype.INT ||
      componentDatatype === ComponentDatatype.UNSIGNED_INT ||
      componentDatatype === ComponentDatatype.FLOAT ||
      componentDatatype === ComponentDatatype.DOUBLE)
  );
}

export default validateComponentDatatype;
