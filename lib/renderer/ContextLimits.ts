/**
 * @public
 */
const ContextLimits = {
  /* @internal */
  _maximumVertexAttributes: 0,
  /* @internal */
  _maximumColorAttachments: 0,
  /* @internal */
  _maximumRenderbufferSize: 0,
  /* @internal */
  _maximumCubeMapSize: 0,

  maximumVertexAttributes: undefined as number,
  maximumColorAttachments: undefined as number,
  maximumRenderbufferSize: undefined as number,
  maximumCubeMapSize: undefined as number,
};

Object.defineProperties(ContextLimits, {
  maximumVertexAttributes: {
    get: function() {
      return ContextLimits._maximumVertexAttributes;
    }
  },
  maximumColorAttachments: {
    get: function() {
      return ContextLimits._maximumColorAttachments;
    }
  },
  maximumRenderbufferSize: {
    get: function() {
      return ContextLimits._maximumRenderbufferSize;
    }
  },
});

export default ContextLimits;
