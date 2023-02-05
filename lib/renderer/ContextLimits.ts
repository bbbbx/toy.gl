const ContextLimits = {
  _maximumVertexAttributes: 0,
  _maximumColorAttachments: 0,
  maximumVertexAttributes: undefined,
  maximumColorAttachments: undefined,
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
})

export default ContextLimits;
