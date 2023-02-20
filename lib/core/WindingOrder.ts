import WebGLConstants from "./WebGLConstants";

/**
 * @public
 * Winding order defines the order of vertices for a triangle to be considered front-facing, see {@link RenderState.frontFace}.
 */
enum WindingOrder {
  CLOCKWISE = WebGLConstants.CW,
  COUNTER_CLOCKWISE = WebGLConstants.CCW,
};

export default WindingOrder;
