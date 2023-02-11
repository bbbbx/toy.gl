/**
 * @public
 */
const ContextLimits = {
  /**
   * @internal
   */
  _maximumVertexAttributes: 0,
  /**
   * @internal
   */
  _maximumColorAttachments: 0,
  maximumVertexAttributes: undefined as number,
  maximumColorAttachments: undefined as number,
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
