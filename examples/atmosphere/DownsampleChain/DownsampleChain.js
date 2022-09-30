import * as ToyGL from '../../../dist/toygl.esm.js';

const DownsampleVert = await fetch('./DownsampleChain/Downsample.vert').then(r => r.text());
const DownsampleFrag = await fetch('./DownsampleChain/Downsample.frag').then(r => r.text());

function DownsampleChain() {
  this.textures = [];
  this.textures.length = 6;
  this._framebuffer = undefined;

  this._gl = undefined;
}

Reflect.defineProperty(DownsampleChain.prototype, 'stageCount', {
  value: 6,
  configurable: false,
  enumerable: true,
  writable: false,
});

DownsampleChain.prototype.initTextures = function(gl, halfResolutionSceneColor) {
  this._gl = gl;

  if (!this._framebuffer) {
    this._framebuffer = gl.createFramebuffer();
  }

  const stageCount = this.stageCount;
  const passNames = [
    null,
    'Scene(1/4)',
    'Scene(1/8)',
    'Scene(1/16)',
    'Scene(1/32)',
    'Scene(1/64)',
  ];

  const textures = this.textures;
  // The first stage is the input.
  textures[0] = halfResolutionSceneColor;

  for (let stageIndex = 1; stageIndex < stageCount; stageIndex++) {
    const previousStageIndex = stageIndex - 1;
    const inputTexture = textures[previousStageIndex];

    if (!textures[stageIndex]) {
      const outputWidth = Math.max(1, Math.round(inputTexture.width / 2));
      const outputHeight = Math.max(1, Math.round(inputTexture.height / 2));
      const format = inputTexture.format;
      const type = inputTexture.type;
      const internalFormat = inputTexture.internalFormat;
    
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inputTexture);
      const wrapS = gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S);
      const wrapT = gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T);
      const minFilter = gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER);
      const magFilter = gl.getTexParameter(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER);
    
      // console.log(outputWidth, outputHeight, format, type, internalFormat, wrapS, wrapT, minFilter, magFilter);
      textures[stageIndex] = ToyGL.createTexture(gl, {
        width: outputWidth,
        height: outputHeight,
        format: format,
        type: type,
        internalFormat: internalFormat,
        wrap: wrapS,
        wrapT: wrapT,
        minFilter: minFilter,
        magFilter: magFilter,
        data: null,
      });
      {
        // Write useful properties to WebGLTexture
        textures[stageIndex].width = outputWidth;
        textures[stageIndex].height = outputHeight;
        textures[stageIndex].format = format;
        textures[stageIndex].type = type;
        textures[stageIndex].internalFormat = internalFormat;
      }
    }

  }
};

DownsampleChain.prototype.downsample = function() {
  const gl = this._gl;
  const stageCount = this.stageCount;
  const textures = this.textures;

  for (let stageIndex = 1; stageIndex < stageCount; stageIndex++) {
    const previousStageIndex = stageIndex - 1;
    const inputTexture = textures[previousStageIndex];
    const outputTexture = textures[stageIndex];

    this.executeDownsamplePass(gl, inputTexture, outputTexture);
  }
};

DownsampleChain.prototype.destroy = function() {
  const gl = this._gl;
  const textures = this.textures;
  for (const texture of textures) {
    if (texture) {
      gl.deleteTexture(texture);
    }
  }

  if (NormalizedDeviceCoordinateVAO) {
    gl.deleteVertexArray(NormalizedDeviceCoordinateVAO);
    NormalizedDeviceCoordinateVAO = undefined;
  }
};

let NormalizedDeviceCoordinateVAO = undefined;

DownsampleChain.prototype.executeDownsamplePass = function(gl, inputTexture, outputTexture) {
  if (!NormalizedDeviceCoordinateVAO) {
    NormalizedDeviceCoordinateVAO = ToyGL.createVAO(gl, {
      attributes: {
        aPosition: {
          location: 0,
          size: 2,
          data: [
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
          ],
        }
      },
      indices: [0, 1, 2, 1, 3, 2],
    });
    NormalizedDeviceCoordinateVAO.count = 6;
  }

  const framebuffer = this._framebuffer;
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, outputTexture);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, outputTexture, 0);

  ToyGL.setState(gl, {
    viewport: [0, 0, outputTexture.width, outputTexture.height],
  });
  ToyGL.draw(gl, {
    vs: DownsampleVert,
    fs: DownsampleFrag,
    uniforms: {
      InputTexture: inputTexture,
      Input_ExtentInverse: [1/inputTexture.width, 1/inputTexture.height],
      Input_UVViewportBilinearMin: [0, 0],
      Input_UVViewportBilinearMax: [1, 1],
      Output_ExtentInverse: [1/outputTexture.width, 1/outputTexture.height],
    },
    attributeLocations: {
      aPosition: 0,
    },
    vao: NormalizedDeviceCoordinateVAO,
    count: NormalizedDeviceCoordinateVAO.count,
    fb: framebuffer,
  });

  return outputTexture;
}

export default DownsampleChain;
