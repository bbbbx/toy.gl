import defined from "../../../core/defined";
import Pass from "../../../renderer/Pass";
import ShaderDestination from "../../../renderer/ShaderDestination";
import BlendingState from "../../BlendingState";
import FrameState from "../../FrameState";
import { Primitive } from "../ModelComponents";
import PrimitiveRenderResources from "../PrimitiveRenderResources";

const AlphaPipelineStage = {
  name: 'AlphaPipelineStage', // Helps with debugging
  process: function (renderResources: PrimitiveRenderResources, primitive: Primitive, frameState: FrameState) {
    const alphaOptions = renderResources.alphaOptions;
    const renderStateOptions = renderResources.renderStateOptions;

    // Set at material pipeline stage
    if (alphaOptions.pass === Pass.TRANSLUCENT) {
      renderStateOptions.cull.enabled = false;
      renderStateOptions.depthMask = false;
      renderStateOptions.blending = BlendingState.ALPHA_BLEND;
    }

    const shaderBuilder = renderResources.shaderBuilder;
    const uniformMap = renderResources.uniformMap;
    if (defined(alphaOptions.alphaCutOff)) {
      shaderBuilder.addDefine('ALPHA_MODE_MASK', undefined, ShaderDestination.FRAGMENT);
      shaderBuilder.addUniform('float', 'u_alphaCutoff', ShaderDestination.FRAGMENT);
      uniformMap.u_alphaCutoff = function() {
        return alphaOptions.alphaCutOff;
      };
    }
  },
};

export default AlphaPipelineStage;
