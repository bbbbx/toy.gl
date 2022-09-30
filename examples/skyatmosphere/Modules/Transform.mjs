// import { Cartesian3, Quaternion } from '../../../src';
import * as ToyGL from '../../../src/index.js';
const { Cartesian3, Quaternion } = ToyGL;

function Transform() {
  this.Rotation = new Quaternion(0, 0, 0, 1);
  this.Translation = new Cartesian3(0, 0, 0);
  this.Scale3D = new Cartesian3(1, 1, 1);
}

Transform.prototype.GetTranslation = function() {
  return this.Translation;
};

export default Transform;
