import defined from "./defined";

/**
 * @public
 */
class DeveloperError extends Error{
  readonly name = 'DeveloperError';

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

  static throwInstantiationError() : never {
    throw new DeveloperError('This function defines an interface and should not be called directly.');
  }
}

export default DeveloperError;
