import FrameState from "../../FrameState";
import Model from "../Model";
import { Node, Primitive } from "../ModelComponents";
import ModelRenderResources from "../ModelRenderResources";
import NodeRenderResources from "../NodeRenderResources";
import PrimitiveRenderResources from "../PrimitiveRenderResources";

interface PipelineStage {
  name: string,
  process: (
    renderResources: ModelRenderResources | NodeRenderResources | PrimitiveRenderResources,
    object: Model | Node | Primitive,
    frameState: FrameState
  ) => void,
}

export default PipelineStage;
