import BoundingSphere from "../../core/BoundingSphere";
import DrawCommand from "../../renderer/DrawCommand";
import FrameState from "../FrameState";
import Model from "./Model";
import { Node, Primitive } from "./ModelComponents";
import AlphaPipelineStage from "./PipelineStages/AlphaPipelineStage";
import GeometryPipelineStage from "./PipelineStages/GeometryPipelineStage";
import LightingPipelineStage from "./PipelineStages/LightingPipelineStage";
import MaterialPipelineStage from "./PipelineStages/MaterialPipelineStage";
import PipelineStage from "./PipelineStages/PipelineStage";
import UpdateStage from "./UpdateStages/UpdateStage";

class ModelRuntimePrimitive {
  primitive: Primitive;
  boundingSphere: BoundingSphere;
  node: Node;
  model: Model;

  pipelineStages: PipelineStage[];
  updateStages: UpdateStage[];
  drawCommand: DrawCommand;

  constructor(options: {
    primitive: Primitive,
    node: Node,
    model: Model,
  }) {
    this.primitive = options.primitive;
    this.node = options.node;
    this.model = options.model;

    this.pipelineStages = [];
    this.updateStages = [];
  }

  configurePipeline(frameState: FrameState) {
    const pipelineStages = this.pipelineStages;
    pipelineStages.length = 0;

    const primitive = this.primitive;
    const node = this.node;
    const model = this.model;

    pipelineStages.push(GeometryPipelineStage);
    pipelineStages.push(MaterialPipelineStage);
    pipelineStages.push(LightingPipelineStage);
    pipelineStages.push(AlphaPipelineStage);
  }
}

export default ModelRuntimePrimitive;
