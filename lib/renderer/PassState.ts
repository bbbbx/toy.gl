import BoundingRectangle from "../core/BoundingRectangle";
import Context from "./Context";
import Framebuffer from "./Framebuffer";

/**
 * The state for a particular rendering pass.
 * This is used to supplement the state in a command being executed.
 * @public
 */
class PassState {
  /**
   * The context used to execute commands for this pass.
   */
  context: Context;

  /**
   * The framebuffer to render to.  This framebuffer is used unless a {@link DrawCommand}
   * or {@link ClearCommand} explicitly define a framebuffer, which is used for off-screen
   * rendering.
   *
   * @defaultValue undefined
   */
  framebuffer: Framebuffer;

  /**
   * When defined, this overrides the blending property of a {@link DrawCommand}'s render state.
   * This is used to, for example, to allow the renderer to turn off blending during the picking pass.
   * <p>
   * When this is <code>undefined</code>, the {@link DrawCommand}'s property is used.
   * </p>
   *
   * @defaultValue undefined
   */
  blendingEnabled: boolean;

  /**
   * When defined, this overrides the scissor test property of a {@link DrawCommand}'s render state.
   * This is used to, for example, to allow the renderer to scissor out the pick region during the picking pass.
   * <p>
   * When this is <code>undefined</code>, the {@link DrawCommand}'s property is used.
   * </p>
   *
   * @defaultValue undefined
   */
  scissorTest: {
    enabled: boolean,
    rectangle: BoundingRectangle,
  };

  /**
   * The viewport used when one is not defined by a {@link DrawCommand}'s render state.
   * @defaultValue undefined
   */
  viewport: BoundingRectangle;

  constructor(context: Context) {
    this.context = context;
    this.framebuffer = undefined;
    this.blendingEnabled = undefined;
    this.scissorTest = undefined;
    this.viewport = undefined;
  }
}

export default PassState;
