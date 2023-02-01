const ContextLimits = {
  _maximumVertexAttributes: 0,
  maximumVertexAttributes: undefined,
};

Object.defineProperties(ContextLimits, {
  maximumVertexAttributes: {
    get: function() {
      return ContextLimits._maximumVertexAttributes;
    }
  }
})

export default ContextLimits;
