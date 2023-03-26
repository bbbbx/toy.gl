import BlendEquation from "../core/BlendEquation";
import BlendFunction from "../core/BlendFunction";

const BlendingState = {
  DISABLED: Object.freeze({
    enabled: false,
  }),

  ALPHA_BLEND: Object.freeze({
    enabled: true,
    equationRgb: BlendEquation.ADD,
    equationAlpha: BlendEquation.ADD,
    functionSourceRgb: BlendFunction.SOURCE_ALPHA,
    functionSourceAlpha: BlendFunction.ONE,
    functionDestinationRgb: BlendFunction.ONE_MINUS_SOURCE_ALPHA,
    functionDestinationAlpha: BlendFunction.ONE_MINUS_SOURCE_ALPHA,
  })
};

export default Object.freeze(BlendingState);
