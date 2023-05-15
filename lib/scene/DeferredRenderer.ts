import BoundingRectangle from "../core/BoundingRectangle";
import Color from "../core/Color";
import ClearCommand from "../renderer/ClearCommand";
import Context from "../renderer/Context";
import DrawCommand from "../renderer/DrawCommand";
import PassState from "../renderer/PassState";
import Camera from "./Camera";
import CameraController from "./CameraController";
import DeferredRenderTargets from "./DeferredRenderTargets";
import FrameState from "./FrameState";
import JobScheduler from "./JobScheduler";
import Scene from "./Scene";
import RenderState from "../renderer/RenderState";
import defined from "../core/defined";
import Texture from "../renderer/Texture";
import defaultValue from "../core/defaultValue";
import ShadingCommon from "../shaders/ShadingCommon.glsl";
import DeferredShadingCommon from "../shaders/DeferredShadingCommon.glsl";
import LightingFS from "../shaders/lighting/LightingFS.glsl";

class DeferredRenderer {
  context: Context;
  frameState: FrameState;
  deferredRenderTargets: DeferredRenderTargets;

  environmentTexture: Texture;

  clearCommand: ClearCommand;
  lightingCommand: DrawCommand;

  public get drawingBufferWidth() : number {
    return this.deferredRenderTargets.width;
  }
  public get drawingBufferHeight() : number {
    return this.deferredRenderTargets.height;
  }

  constructor(canvas: HTMLCanvasElement) {
    const context = new Context(canvas, {
      glContextAttributes: {
        preserveDrawingBuffer: false,
        alpha: false,
        depth: false,
      }
    });

    const jobScheduler = new JobScheduler();
    const frameState = new FrameState(context, jobScheduler);

    this.deferredRenderTargets = new DeferredRenderTargets({
      context: context,
    });
    this.context = context;
    this.frameState = frameState;

    this.clearCommand = new ClearCommand({
      color: new Color(0, 0, 0, 0),
      depth: 1,
    });

    this.lightingCommand = context.createViewportQuadCommand(`
      ${ShadingCommon}
      ${DeferredShadingCommon}
      ${LightingFS}
      `, {
      uniformMap: {
        u_RT0: () => this.deferredRenderTargets.colorBuffers[0],
        u_RT1: () => this.deferredRenderTargets.colorBuffers[1],
        u_RT2: () => this.deferredRenderTargets.colorBuffers[2],
        u_RT3: () => this.deferredRenderTargets.colorBuffers[3],
        u_RT4: () => this.deferredRenderTargets.colorBuffers[4],
        u_RT5: () => this.deferredRenderTargets.colorBuffers[5],
        u_RT6: () => this.deferredRenderTargets.colorBuffers[6],
        // u_RT7: () => frameState.deferredRenderTargets.getRT7(),
        u_depthTexture: () => this.deferredRenderTargets.depthBuffer,
        // uInverseProjectionMatrix: () => camera.frustum.inverseProjectionMatrix,
        u_environmentTexture: () => defaultValue(this.environmentTexture, context.defaultTexture),
      },
    });
  }

  update(scene: Scene, camera: Camera) {
    scene.beforeUpdate.raiseEvent(this);

    camera.update();

    const frameState = this.frameState;

    frameState.jobScheduler.resetBudgets();
    frameState.commandList.length = 0;
    frameState.camera = camera;

    // Update global uniforms values, e.g. camera position
    frameState.context.uniformState.update(frameState);

    // Culling


    // Create bass pass draw commands from scene objects
    scene.objects.forEach(object => {
      object.update(frameState);
    });
  }

  executeBasePass() {
    const frameState = this.frameState;
    const context = frameState.context;
    const clearCommand = this.clearCommand;
    const deferredRenderTargets = this.deferredRenderTargets;
    const width = deferredRenderTargets.width;
    const height = deferredRenderTargets.height;

    const basePassState = new PassState(context);
    basePassState.viewport = new BoundingRectangle(0, 0, width, height);
    basePassState.framebuffer = deferredRenderTargets.framebuffer;

    clearCommand.framebuffer = deferredRenderTargets.framebuffer;
    clearCommand.execute(context, basePassState);

    const commandList = frameState.commandList;
    const commandLength = commandList.length;
    for (let i = 0; i < commandLength; i++) {
      const command = commandList[i];
      command.execute(context, basePassState);
    }
  }

  executeLightingPass() {
    const frameState = this.frameState;
    const context = frameState.context;
    const clearCommand = this.clearCommand;
    const deferredRenderTargets = this.deferredRenderTargets;
    const width = deferredRenderTargets.width;
    const height = deferredRenderTargets.height;

    const lightingPassState = new PassState(context);
    lightingPassState.viewport = new BoundingRectangle(0, 0, width, height);
    lightingPassState.framebuffer = undefined;

    clearCommand.framebuffer = undefined;
    clearCommand.execute(context, lightingPassState);

    this.lightingCommand.execute(context, lightingPassState);
  }

  render() {
    // Base Pass
    this.executeBasePass();

    // Lighting Pass
    this.executeLightingPass();

    // Translucent Pass

    // Post Process
  }
}

export default DeferredRenderer;
