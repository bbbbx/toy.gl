import FrameState from "../../FrameState";
import { Primitive } from "../ModelComponents";
import PrimitiveRenderResources from "../PrimitiveRenderResources";

const LightingPipelineStage = {
  name: 'LightingPipelineStage', // Helps with debugging
  process: function (renderResources: PrimitiveRenderResources, primitive: Primitive, frameState: FrameState) {
    
  }
};

export default LightingPipelineStage;
