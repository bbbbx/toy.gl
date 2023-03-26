import FrameState from "../../FrameState";
import ModelRuntimeNode from "../ModelRuntimeNode";
import ModelRuntimePrimitive from "../ModelRuntimePrimitive";
import ModelSceneGraph from "../ModelSceneGraph";

interface UpdateStage {
  name: string,
  update: (runtimeObj: ModelRuntimeNode | ModelRuntimePrimitive, sceneGraph: ModelSceneGraph, frameState: FrameState) => void,
}

export default UpdateStage;
