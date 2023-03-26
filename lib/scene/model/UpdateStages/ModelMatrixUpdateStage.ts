import clone from "../../../core/clone";
import Matrix4 from "../../../math/Matrix4";
import RenderState from "../../../renderer/RenderState";
import FrameState from "../../FrameState";
import ModelRuntimeNode from "../ModelRuntimeNode";
import ModelSceneGraph from "../ModelSceneGraph";
import ModelUtility from "../ModelUtility";

const ModelMatrixUpdateStage = {
  name: 'ModelMatrixUpdateStage', // Helps with debugging
  update: function (runtimeNode: ModelRuntimeNode, sceneGraph: ModelSceneGraph, frameState: FrameState) {
    if (!runtimeNode._transformDirty) {
      return;
    }

    const modelMatrix = sceneGraph._computedModelMatrix;

    updateRuntimeNode(
      runtimeNode,
      sceneGraph,
      modelMatrix,
      runtimeNode.transformToRoot
    );
    runtimeNode._transformDirty = false;
  }
};

function updateRuntimeNode(
  runtimeNode: ModelRuntimeNode,
  sceneGraph: ModelSceneGraph,
  modelMatrix: Matrix4,
  transformToRoot: Matrix4
) {
  // Apply the current node's transform to the end of the chain
  transformToRoot = Matrix4.multiplyTransformation(transformToRoot, runtimeNode.transform, new Matrix4());

  runtimeNode.updateComputedTransform();

  let i;

  const primitivesLength = runtimeNode.runtimePrimitives.length;
  for (i = 0; i < primitivesLength; i++) {
    const runtimePrimitive = runtimeNode.runtimePrimitives[i];
    const drawCommand = runtimePrimitive.drawCommand;
    drawCommand.modelMatrix = Matrix4.multiplyTransformation(
      modelMatrix,
      transformToRoot,
      drawCommand.modelMatrix
    );

    // TODO:
    const renderState = clone(drawCommand.renderState, true);
    renderState.cull.face = ModelUtility.getCullFace(drawCommand.modelMatrix, drawCommand.primitiveType);;
    drawCommand.renderState = RenderState.fromCache(renderState);
  }

  const childrenLength = runtimeNode.children.length;
  for (i = 0; i < childrenLength; i++) {
    const childRuntimeNode = sceneGraph._runtimeNodes[runtimeNode.children[i]];

    // Update transformToRoot to accommodate changes in the transforms of this node and its ancestors
    childRuntimeNode._transformToRoot = Matrix4.clone(transformToRoot, childRuntimeNode._transformToRoot);

    updateRuntimeNode(childRuntimeNode, sceneGraph, modelMatrix, transformToRoot);
    childRuntimeNode._transformDirty = false;
  }
}

export default ModelMatrixUpdateStage;
