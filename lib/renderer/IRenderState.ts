import BlendEquation from "../core/BlendEquation";
import BlendFunction from "../core/BlendFunction";
import BoundingRectangle from "../core/BoundingRectangle";
import Color from "../core/Color";
import CullFace from "../core/CullFace";
import DepthFunction from "../core/DepthFunction";
import StencilFunction from "../core/StencilFunction";
import StencilOperation from "../core/StencilOperation";
import WindingOrder from "../core/WindingOrder";

/**
 * @public
 */
interface RenderStateConstructor {
  frontFace?: WindingOrder;
  cull?: {
    enabled?: boolean,
    face?: CullFace,
  },
  viewport?: BoundingRectangle,
  scissorTest?: {
    enabled?: boolean,
    rectangle?: BoundingRectangle,
  },
  colorMask?: {
    red?: boolean,
    green?: boolean,
    blue?: boolean,
    alpha?: boolean,
  },
  depthTest?: {
    enabled?: boolean,
    func?: DepthFunction,
  },
  depthMask?: boolean,
  depthRange?: {
    near?: number,
    far?: number,
  },
  stencilTest?: {
    enabled?: boolean,
    frontFunction?: StencilFunction
    backFunction?: StencilFunction,
    reference?: number,
    mask?: number,
    frontOperation?: {
      fail?: StencilOperation,
      zFail?: StencilOperation,
      zPass?: StencilOperation,
    },
    backOperation?: {
      fail?: StencilOperation,
      zFail?: StencilOperation,
      zPass?: StencilOperation,
    },
  },
  stencilMask?: number,
  blending?: {
    enabled?: boolean,
    color?: Color,
    equationRgb?: BlendEquation,
    equationAlpha?: BlendEquation,
    functionSourceRgb?: BlendFunction,
    functionSourceAlpha?: BlendFunction,
    functionDestinationRgb?: BlendFunction,
    functionDestinationAlpha?: BlendFunction,
  },
  sampleCoverage?: {
    enabled?: boolean,
    value?: number,
    invert?: boolean,
  },
  polygonOffset?: {
    enabled?: boolean,
    factor?: number,
    units?: number,
  },
  lineWidth?: number,
}

export default RenderStateConstructor;
