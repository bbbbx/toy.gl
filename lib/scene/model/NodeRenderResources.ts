import clone from "../../core/clone";
import { UniformMap } from "../../renderer/IDrawCommand";
import { VertexArrayAttribute } from "../../renderer/IVertexArray";
import RenderStateConstructor from "../../renderer/IRenderState";
import ShaderBuilder from "../../renderer/ShaderBuilder";
import Model from "./Model";
import ModelAlphaOptions from "./ModelAlphaOptions";
import ModelRenderResources from "./ModelRenderResources";
import ModelRuntimeNode from "./ModelRuntimeNode";

class NodeRenderResources {
  model: Model
  shaderBuilder: ShaderBuilder;
  uniformMap: UniformMap;
  renderStateOptions: RenderStateConstructor;
  alphaOptions: ModelAlphaOptions;

  runtimeNode: ModelRuntimeNode;
  /**
   * An array of objects describing vertex attributes that will eventually
   * be used to create a {@link VertexArray} for the draw command. Attributes
   * at the node level may be needed for extensions such as EXT_mesh_gpu_instancing.
   */
  attributes: VertexArrayAttribute[];
  /**
   * The index to give to the next vertex attribute added to the attributes array.
   * POSITION takes index 0.
   */
  attributeIndex: number = 1;
  instanceCount: number;

  constructor(modelRenderResources: ModelRenderResources, runtimeNode: ModelRuntimeNode) {
    this.model = modelRenderResources.model;
    this.shaderBuilder = modelRenderResources.shaderBuilder.clone();
    this.uniformMap = clone(modelRenderResources.uniformMap);
    this.alphaOptions = clone(modelRenderResources.alphaOptions);
    this.renderStateOptions = clone(modelRenderResources.renderStateOptions, true);

    this.runtimeNode = runtimeNode;
    this.attributes = [];
    // this.attributeIndex = 0;
    this.instanceCount = 0;
  }
}

export default NodeRenderResources;
