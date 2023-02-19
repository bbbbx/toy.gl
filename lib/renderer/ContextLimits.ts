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
  /* @internal */
  _maximumTextureFilterAnisotropy: 0,

  get maximumVertexAttributes() : number {
    return this._maximumVertexAttributes;
  },
  get maximumColorAttachments() : number {
    return this._maximumColorAttachments;
  },
  get maximumRenderbufferSize() : number {
    return this._maximumRenderbufferSize;
  },
  get maximumCubeMapSize() : number {
    return this._maximumCubeMapSize;
  },
  get maximumTextureFilterAnisotropy() : number {
    return this._maximumTextureFilterAnisotropy;
  },
};

export default ContextLimits;
