/**
 * @public
 */
const ContextLimits = {
  /* @internal */
  _maximumVertexAttributes: 0,
  /* @internal */
  _maximumColorAttachments: 0,
  /* @internal */
  _maximumDrawBuffers: 0,
  /* @internal */
  _maximumRenderbufferSize: 0,
  /* @internal */
  _maximumTextureSize: 0,
  /* @internal */
  _maximumCubeMapSize: 0,
  /* @internal */
  _maximum3DTextureSize: 0,
  /* @internal */
  _maximumArrayTextureLayers: 0,
  /* @internal */
  _maximumTextureFilterAnisotropy: 0,

  get maximumVertexAttributes() : number {
    return this._maximumVertexAttributes;
  },
  get maximumColorAttachments() : number {
    return this._maximumColorAttachments;
  },
  get maximumDrawBuffers() : number {
    return this._maximumDrawBuffers;
  },
  get maximumRenderbufferSize() : number {
    return this._maximumRenderbufferSize;
  },
  get maximumTextureSize() : number {
    return this._maximumTextureSize;
  },
  get maximumCubeMapSize() : number {
    return this._maximumCubeMapSize;
  },
  get maximum3DTextureSize() : number {
    return this._maximum3DTextureSize;
  },
  get maximumArrayTextureLayers() : number {
    return this._maximumArrayTextureLayers;
  },
  get maximumTextureFilterAnisotropy() : number {
    return this._maximumTextureFilterAnisotropy;
  },
};

export default ContextLimits;
