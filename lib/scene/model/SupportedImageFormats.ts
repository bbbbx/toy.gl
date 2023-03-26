import defaultValue from "../../core/defaultValue";

class SupportedImageFormats {
  webp: boolean;
  basis: boolean;

  constructor(options: {
    webp?: boolean,
    basis?: boolean
  } = defaultValue.EMPTY_OBJECT) {
    this.webp = defaultValue(options.webp, false);
    this.basis = defaultValue(options.basis, false);
  }
}

export default SupportedImageFormats;
