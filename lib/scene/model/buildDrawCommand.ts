import clone from "../../core/clone";
import DrawCommand from "../../renderer/DrawCommand";
import RenderState from "../../renderer/RenderState";
import VertexArray from "../../renderer/VertexArray";
import FrameState from "../FrameState";
import PrimitiveRenderResources from "./PrimitiveRenderResources";
import Matrix4 from "../../math/Matrix4";
import ModelUtility from "./ModelUtility";
import ModelVS from "../../shaders/model/ModelVS.glsl";
import ModelFS from "../../shaders/model/ModelFS.glsl";

function buildDrawCommand(primitiveRenderResources: PrimitiveRenderResources, frameState: FrameState) : DrawCommand {
  const model = primitiveRenderResources.model;
  const context = frameState.context;

  const shaderBuilder = primitiveRenderResources.shaderBuilder;
  shaderBuilder.addVertexLines([ ModelVS ]);
  shaderBuilder.addFragmentLines([ ModelFS ]);

  const shaderProgram = shaderBuilder.buildShaderProgram(context);
  model._pipelineResources.push(shaderProgram);

  const indexBuffer = primitiveRenderResources.indices?.buffer;
  const vertexArray = new VertexArray({
    context: context,
    attributes: primitiveRenderResources.attributes,
    indexBuffer: indexBuffer,
  });
  model._pipelineResources.push(vertexArray);

  const sceneGraph = model.sceneGraph;

  const computedModelMatrix = sceneGraph._computedModelMatrix;
  const modelMatrix = Matrix4.multiplyTransformation(
    computedModelMatrix,
    primitiveRenderResources.runtimeNode.computedTransform,
    new Matrix4()
  );

  let renderState = clone(RenderState.fromCache(primitiveRenderResources.renderStateOptions), true);
  renderState.cull.face = ModelUtility.getCullFace(modelMatrix, primitiveRenderResources.primitiveType);
  renderState = RenderState.fromCache(renderState);

  return new DrawCommand({
    modelMatrix: modelMatrix,
    uniformMap: primitiveRenderResources.uniformMap,
    renderState: renderState,
    vertexArray: vertexArray,
    shaderProgram: shaderProgram,
    count: primitiveRenderResources.count,
    owner: model,
    instanceCount: primitiveRenderResources.instanceCount,
    primitiveType: primitiveRenderResources.primitiveType,
    // framebuffer: frameState.deferredRenderTargets.framebuffer,
    pass: primitiveRenderResources.alphaOptions.pass,
  });
}

export default buildDrawCommand;
