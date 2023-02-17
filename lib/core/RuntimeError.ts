import defined from "./defined";

/**
 * @public
 */
class RuntimeError extends Error {
  readonly name = 'RuntimeError';

  constructor(message?: string) {
    super(message);
  }

  public toString() {
    let str = `${this.name}: ${this.message}`;

    if (defined(this.stack)) {
      str += `\n${this.stack.toString()}`;
    }

    return str;
  }
}

export default RuntimeError;
