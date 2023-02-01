import defined from "./defined";

class DeveloperError extends Error{
  name = 'DeveloperError';
  message: string;
  stack;

  constructor(message) {
    super();

    this.message = message;

    let stack;
    try {
      throw new Error();
    } catch (e) {
      stack = e.stack;
    }

    this.stack = stack;
  }

  public toString() {
    let str = `${this.name}: ${this.message}`;

    if (defined(this.stack)) {
      str += `\n${this.stack.toString()}`;
    }

    return str;
  }

  throwInstantiationError() {
    throw new DeveloperError('This function defines an interface and should not be called directly.');
  }
}

export default DeveloperError;
