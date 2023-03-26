import DepthFunction from "../../core/DepthFunction";
import { UniformMap } from "../../renderer/IDrawCommand";
import RenderStateConstructor from "../../renderer/IRenderState";
import RenderState from "../../renderer/RenderState";
import ShaderBuilder from "../../renderer/ShaderBuilder";
import Model from "./Model";
import ModelAlphaOptions from "./ModelAlphaOptions";

class ModelRenderResources {
  model: Model
  shaderBuilder: ShaderBuilder;
  uniformMap: UniformMap;
  renderStateOptions: ConstructorParameters<typeof RenderState>[0];
  alphaOptions: ModelAlphaOptions;

  constructor(model) {
    this.model = model;
    this.shaderBuilder = new ShaderBuilder();
    this.uniformMap = {};
    this.alphaOptions = new ModelAlphaOptions();
    this.renderStateOptions = RenderState.getState(
      RenderState.fromCache({
        depthTest: {
          enabled: true,
          func: DepthFunction.LESS_OR_EQUAL,
        }
      })
    );
  }
}

export default ModelRenderResources;
