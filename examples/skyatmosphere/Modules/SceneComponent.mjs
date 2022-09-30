import Transform from './Transform.mjs';

function SceneComponent() {
  this.ComponentToWorld = new Transform();
}

SceneComponent.prototype.GetComponentTransform = function() {
  return this.ComponentToWorld;
};

export default SceneComponent;
