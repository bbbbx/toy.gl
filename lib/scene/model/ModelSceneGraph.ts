import defined from "../../core/defined";
import Matrix4 from "../../math/Matrix4";
import FrameState from "../FrameState";
import Model from "./Model";
import { Components, Node } from "./ModelComponents";
import ModelRenderResources from "./ModelRenderResources";
import ModelRuntimeNode from "./ModelRuntimeNode";
import ModelRuntimePrimitive from "./ModelRuntimePrimitive";
import ModelSkin from "./ModelSkin";
import ModelUtility from "./ModelUtility";
import NodeRenderResources from "./NodeRenderResources";
import PrimitiveRenderResources from "./PrimitiveRenderResources";
import buildDrawCommand from "./buildDrawCommand";
import Cartesian3 from "../../math/Cartesian3";
import BoundingSphere from "../../core/BoundingSphere";

function computeModelMatrix(sceneGraph: ModelSceneGraph, modelMatrix: Matrix4) {
  const components = sceneGraph._components;
  const model = sceneGraph._model;

  sceneGraph._computedModelMatrix = Matrix4.multiplyTransformation(
    modelMatrix,
    components.transform,
    sceneGraph._computedModelMatrix
  );

  sceneGraph._computedModelMatrix = Matrix4.multiplyTransformation(
    sceneGraph._computedModelMatrix,
    sceneGraph._axisCorrectionMatrix,
    sceneGraph._computedModelMatrix
  );

  sceneGraph._computedModelMatrix = Matrix4.multiplyByUniformScale(
    sceneGraph._computedModelMatrix,
    model.computedScale,
    sceneGraph._computedModelMatrix
  );
}

function initialize(sceneGraph: ModelSceneGraph) {
  const components = sceneGraph._components;
  const scene = components.scene;
  const model = sceneGraph._model;

  const nodes = components.nodes;
  const nodesLength = nodes.length;

  // Initialize this array to be the same size as the nodes array in
  // the model file. This is so the node indices remain the same. However,
  // only nodes reachable from the scene's root node will be populated, the
  // rest will be undefined
  sceneGraph._runtimeNodes = new Array(nodesLength);

  const rootNodes = scene.nodes;
  const rootNodesLength = rootNodes.length;
  const transformToRoot = Matrix4.IDENTITY;
  for (let i = 0; i < rootNodesLength; i++) {
    const rootNode = scene.nodes[i];

    const rootNodeIndex = traverseAndCreateSceneGraph(
      sceneGraph,
      rootNode,
      transformToRoot
    );

    sceneGraph._rootNodes.push(rootNodeIndex);
  }

  const skins = components.skins;
  const runtimeSkins = sceneGraph._runtimeSkins;

  const skinsLength = skins.length;
  for (let i = 0; i < skinsLength; i++) {
  }

  const skinnedNodes = sceneGraph._skinnedNodes;
  const skinnedNodesLength = skinnedNodes.length;
  for (let i = 0; i < skinnedNodesLength; i++) {
  }
}

function traverseAndCreateSceneGraph(
  sceneGraph: ModelSceneGraph,
  node: Node,
  transformToRoot: Matrix4
) : number {
  const childrenIndices = [];
  const transform = ModelUtility.getNodeTransform(node);

  const childrenLength = node.children.length;
  for (let i = 0; i < childrenLength; i++) {
    const childNode = node.children[i];

    const childNodeTransformToRoot = Matrix4.multiplyTransformation(
      transformToRoot,
      transform,
      new Matrix4()
    );

    const childIndex = traverseAndCreateSceneGraph(sceneGraph, childNode, childNodeTransformToRoot);
    childrenIndices.push(childIndex);
  }

  const runtimeNode = new ModelRuntimeNode({
    node: node,
    transform: transform,
    transformToRoot: transformToRoot,
    children: childrenIndices,
    sceneGraph: sceneGraph,
  });

  const primitivesLength = node.primitives.length;
  for (let i = 0; i < primitivesLength; i++) {
    const runtimePrimitive = new ModelRuntimePrimitive({
      primitive: node.primitives[i],
      node: node,
      model: sceneGraph._model,
    });
    runtimeNode.runtimePrimitives.push(runtimePrimitive);
  }

  const index = node.index;
  sceneGraph._runtimeNodes[index] = runtimeNode;

  if (defined(node.skin)) {
    sceneGraph._skinnedNodes.push(index);
  }

  const name = node.name;
  if (defined(name)) {

  }

  return index;
}

class ModelSceneGraph {
  _model: Model;
  _components: Components;

  _runtimeNodes: ModelRuntimeNode[];
  _rootNodes: number[];
  _skinnedNodes: number[];
  _runtimeSkins: ModelSkin[];
  _computedModelMatrix: Matrix4;

  _axisCorrectionMatrix: Matrix4;

  _boundingSphere: BoundingSphere;

  modelPipelineStages: [];
  public get components() { return this._components; }
  public get computedModelMatrix() { return this._computedModelMatrix; }

  constructor(options: {
    model: Model,
    components: Components
  }) {
    const components = options.components;

    this._model = options.model;
    this._components = components;

    this._runtimeNodes = [];
    this._rootNodes = [];
    this._skinnedNodes = [];
    this._runtimeSkins = [];
    this._computedModelMatrix = Matrix4.clone(Matrix4.IDENTITY);

    this._axisCorrectionMatrix = ModelUtility.getAxisCorrectionMatrix(
      components.upAxis,
      components.forwardAxis
    );

    this.modelPipelineStages = [];

    initialize(this);
  }

  private configurePipeline(frameState: FrameState) {
    const modelPipelineStages = this.modelPipelineStages;
    modelPipelineStages.length = 0;

    const model = this._model;
  }

  update(frameState: FrameState, updateForAnimations: boolean) {
    let i: number, j: number, k: number;

    for (i = 0; i < this._runtimeNodes.length; i++) {
      const runtimeNode = this._runtimeNodes[i];

      // If a node in the model was unreachable from the scene graph, there will
      // be no corresponding runtime node and therefore should be skipped.
      if (!defined(runtimeNode)) {
        continue;
      }

      for (j = 0; j < runtimeNode.updateStages.length; j++) {
        const nodeUpdateStage = runtimeNode.updateStages[j];
        nodeUpdateStage.update(runtimeNode, this, frameState);
      }

      if (updateForAnimations) {
        // this.updateJointMatrices();
      }

      for (j = 0; j < runtimeNode.runtimePrimitives.length; j++) {
        const runtimePrimitive = runtimeNode.runtimePrimitives[j];
        for (k = 0; k < runtimePrimitive.updateStages.length; k++) {
          const primitiveUpdateStage = runtimePrimitive.updateStages[k];
          primitiveUpdateStage.update(runtimePrimitive, this, frameState);
        }
      }
    }
  }

  buildDrawCommands(frameState: FrameState) {
    const model = this._model;
    const modelRenderResource = new ModelRenderResources(model);

    // process model pipeline stages
    this.configurePipeline(frameState);
    const modelPipelineStages = this.modelPipelineStages;
    for (let i = 0; i < modelPipelineStages.length; i++) {
      // modelPipelineStages[i].process(modelRenderResource, model, frameState);
    }

    const modelPositionMin = Cartesian3.fromElements(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    const modelPositionMax = Cartesian3.fromElements(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);
    let includePrimitives = false;

    // process node/primitive pipeline stages
    const runtimeNodeLength = this._runtimeNodes.length;
    for (let i = 0; i < runtimeNodeLength; i++) {
      const runtimeNode = this._runtimeNodes[i];

      if (!defined(runtimeNode)) {
        continue;
      }

      const nodeRenderResources = new NodeRenderResources(modelRenderResource, runtimeNode);

      // process node pipeline stages
      runtimeNode.configurePipeline();
      const nodePipelineStages = runtimeNode.pipelineStages;
      for (let j = 0; j < nodePipelineStages.length; j++) {
        nodePipelineStages[j].process(nodeRenderResources, runtimeNode.node, frameState);
      }

      const nodeTransform = runtimeNode.computedTransform;
      // process primitive pipeline stages
      const runtimePrimitivesLength = runtimeNode.runtimePrimitives.length;

      for (let j = 0; j < runtimePrimitivesLength; j++) {
        const runtimePrimitive = runtimeNode.runtimePrimitives[j];

        runtimePrimitive.configurePipeline(frameState);
        const primitivePipelineStages = runtimePrimitive.pipelineStages;

        const primitiveRenderResources = new PrimitiveRenderResources(nodeRenderResources, runtimePrimitive);

        for (let k = 0; k < primitivePipelineStages.length; k++) {
          primitivePipelineStages[k].process(
            primitiveRenderResources,
            runtimePrimitive.primitive,
            frameState
          );
        }

        runtimePrimitive.boundingSphere = BoundingSphere.clone(primitiveRenderResources.boundingSphere);

        const primitivePositionMin = Matrix4.multiplyByPoint(nodeTransform, primitiveRenderResources.positionMin, scratchPrimitivePositionMin);
        const primitivePositionMax = Matrix4.multiplyByPoint(nodeTransform, primitiveRenderResources.positionMax, scratchPrimitivePositionMax);

        Cartesian3.minimumByComponent(modelPositionMin, primitivePositionMin, modelPositionMin);
        Cartesian3.maximumByComponent(modelPositionMax, primitivePositionMax, modelPositionMax);

        runtimePrimitive.drawCommand = buildDrawCommand(primitiveRenderResources, frameState);

        includePrimitives = true;
      }
    }

    this._boundingSphere = includePrimitives
      ? BoundingSphere.fromCornerPoints(modelPositionMin, modelPositionMax)
      : new BoundingSphere();

    this._boundingSphere = BoundingSphere.transformWithoutScale(this._boundingSphere, this._axisCorrectionMatrix, this._boundingSphere);
    this._boundingSphere = BoundingSphere.transform(this._boundingSphere, this._components.transform, this._boundingSphere);

    model._boundingSphere = BoundingSphere.transform(this._boundingSphere, model.modelMatrix, model._boundingSphere);
    model._boundingSphere.radius *= model._scale;

    model._initialRadius = model._boundingSphere.radius;
  }

  updateModelMatrix(modelMatrix: Matrix4, frameState: FrameState) {
    computeModelMatrix(this, modelMatrix);

    // Mark all root nodes are dirty. Any and all children will be
    // affected recursively in the update stage.
    const rootNodes = this._rootNodes;
    for (let i = 0; i < rootNodes.length; i++) {
      const node = this._runtimeNodes[rootNodes[i]];
      node._transformDirty = true;
    }
  }

  updateBackFaceCulling(backFaceCulling: boolean) {
    // const backFaceCullingOptions = scratchBackFaceCullingOptions;
    // backFaceCullingOptions.backFaceCulling = backFaceCulling;
    forEachRuntimePrimitive(
      this,
      false,
      updatePrimitiveBackFaceCulling,
      backFaceCulling // backFaceCullingOptions
    );
  }

  pushDrawCommands(frameState: FrameState) {
    const pushDrawCommandOptions = {
      frameState: frameState,
    };
    forEachRuntimePrimitive(
      this,
      true,
      pushPrimitiveDrawCommands,
      frameState
    );
  }
}

const scratchPrimitivePositionMin = new Cartesian3();
const scratchPrimitivePositionMax = new Cartesian3();

function updatePrimitiveBackFaceCulling(runtimePrimitive: ModelRuntimePrimitive, backFaceCulling: boolean) {
  // const drawCommand = runtimePrimitive.drawCommand;
  // drawCommand.backFaceCulling = options.backFaceCulling;
}

function pushPrimitiveDrawCommands(runtimePrimitive: ModelRuntimePrimitive, frameState: FrameState) {
  frameState.commandList.push(runtimePrimitive.drawCommand);
}

function forEachRuntimePrimitive<T>(
  sceneGraph: ModelSceneGraph,
  visibleNodesOnly: boolean,
  callback: (runtimePrimitive: ModelRuntimePrimitive, options: T) => void,
  callbackOptions: T,
) {
  const rootNodes = sceneGraph._rootNodes;
  const rootNodesLength = rootNodes.length;
  for (let i = 0; i < rootNodesLength; i++) {
    const rootNodeIndex = rootNodes[i];
    const runtimeNode = sceneGraph._runtimeNodes[rootNodeIndex];
    traverseSceneGraph(
      sceneGraph,
      runtimeNode,
      visibleNodesOnly,
      callback,
      callbackOptions
    );
  }
}

function traverseSceneGraph<T>(
  sceneGraph: ModelSceneGraph,
  runtimeNode: ModelRuntimeNode,
  visibleNodesOnly: boolean,
  callback: (runtimePrimitive: ModelRuntimePrimitive, options: T) => void,
  callbackOptions: T
) {
  if (visibleNodesOnly && !runtimeNode.show) {
    return;
  }

  const childrenLength = runtimeNode.children.length;
  for (let i = 0; i < childrenLength; i++) {
    const childRuntimeNode = runtimeNode.getChild(i);
    traverseSceneGraph(
      sceneGraph,
      childRuntimeNode,
      visibleNodesOnly,
      callback,
      callbackOptions
    );
  }

  const runtimePrimitives = runtimeNode.runtimePrimitives;
  const runtimePrimitivesLength = runtimePrimitives.length;
  for (let j = 0; j < runtimePrimitivesLength; j++) {
    const runtimePrimitive = runtimePrimitives[j];
    callback(runtimePrimitive, callbackOptions);
  }
}


export default ModelSceneGraph;
