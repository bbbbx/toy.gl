import Cartesian3 from "../../math/Cartesian3";
import Matrix4 from "../../math/Matrix4";
import { Node } from "./ModelComponents";
import ModelRuntimePrimitive from "./ModelRuntimePrimitive";
import ModelSceneGraph from "./ModelSceneGraph";
import PipelineStage from "./PipelineStages/PipelineStage";
import ModelMatrixUpdateStage from "./UpdateStages/ModelMatrixUpdateStage";
import UpdateStage from "./UpdateStages/UpdateStage";

function initialize(runtimeNode: ModelRuntimeNode) {
  const transform = runtimeNode.transform;
  const transformToRoot = runtimeNode.transformToRoot;
  const computedTransform = runtimeNode._computedTransform;
  runtimeNode._computedTransform = Matrix4.multiply(
    transformToRoot,
    transform,
    computedTransform
  );
}

class ModelRuntimeNode {
  _node: Node;
  _name: string;
  _index: number;
  _sceneGraph: ModelSceneGraph;
  _children: number[];
  _transform: Matrix4;
  _transformDirty: boolean;
  _transformToRoot: Matrix4;
  _computedTransform: Matrix4;
  _originalTransform: Matrix4;

  /** This value is set by InstancingPipelineStage */
  instancingTranslationMin: Cartesian3;
  /** This value is set by InstancingPipelineStage */
  instancingTranslationMax: Cartesian3;

  public get node() { return this._node; }
  public get sceneGraph() { return this._sceneGraph; }
  public get children() { return this._children; }
  /**
   * The node's local space transform. This can be changed externally via
   * the corresponding {@link ModelNode}, such that animation can be
   * driven by another source, not just an animation in the model's asset.
   */
  public get transform() { return this._transform; }
  public set transform(value: Matrix4) {
    this._transformDirty = true;
    this._transform = Matrix4.clone(value, this._transform);
  }
  public get transformToRoot() { return this._transformToRoot; }
  public get computedTransform() { return this._computedTransform; }
  public get originalTransform() { return this._originalTransform; }

  show: boolean;
  pipelineStages: PipelineStage[];
  updateStages: UpdateStage[];
  runtimePrimitives: ModelRuntimePrimitive[];

  constructor(options: {
    node: Node,
    transform: Matrix4,
    transformToRoot: Matrix4,
    children: number[],
    sceneGraph: ModelSceneGraph,
  }) {
    const node = options.node;
    const transform = options.transform;
    const transformToRoot = options.transformToRoot;
    const children = options.children;
    const sceneGraph = options.sceneGraph;

    this._node = node;
    this._name = node.name;
    this._index = node.index;
    this._sceneGraph = sceneGraph;
    this._children = children;

    this._originalTransform = Matrix4.clone(transform, this._originalTransform);
    this._transform = Matrix4.clone(transform, this._transform);
    this._transformToRoot = Matrix4.clone(transformToRoot, this._transformToRoot);

    this._computedTransform = new Matrix4(); // Computed in initialize()
    this._transformDirty = false;

    this.show = true;
    this.pipelineStages = [];
    this.updateStages = [];
    this.runtimePrimitives = [];

    initialize(this);
  }

  configurePipeline() {
    const updateStages = this.updateStages;
    updateStages.length = 0;

    updateStages.push(ModelMatrixUpdateStage);
  }

  getChild(index: number) : ModelRuntimeNode {
    return this._sceneGraph._runtimeNodes[this.children[index]];
  }

  updateComputedTransform() {
    this._computedTransform = Matrix4.multiply(
      this._transformToRoot,
      this._transform,
      this._computedTransform
    );
  }
}

export default ModelRuntimeNode;
