import WebGLConstants from "../core/WebGLConstants";
import AutomaticUniform from "./AutomaticUniform";
import UniformState from "./UniformState";

const AutomaticUniforms: {
  [uniformName: string]: AutomaticUniform,
} = {
  toy_modelMatrix: new AutomaticUniform({
    size: 1,
    datatype: WebGLConstants.FLOAT_MAT4,
    getValue: function (uniformState: UniformState) {
      return uniformState.model;
    },
  }),

  toy_modelViewMatrix: new AutomaticUniform({
    size: 1,
    datatype: WebGLConstants.FLOAT_MAT4,
    getValue: function (uniformState: UniformState) {
      return uniformState.modelView;
    },
  }),

  toy_projectionMatrix: new AutomaticUniform({
    size: 1,
    datatype: WebGLConstants.FLOAT_MAT4,
    getValue: function (uniformState: UniformState) {
      return uniformState.projection;
    },
  }),

  toy_normalMatrix: new AutomaticUniform({
    size: 1,
    datatype: WebGLConstants.FLOAT_MAT3,
    getValue: function (uniformState: UniformState) {
      return uniformState.normal;
    },
  }),
};

export default AutomaticUniforms;