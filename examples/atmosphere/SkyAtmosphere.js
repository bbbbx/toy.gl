const NormalizedQuadVert = await fetch('./NormalizedQuad.vert').then(r => r.text());
const CommonFrag = await fetch('./Common.frag').then(r => r.text());
const TransmittanceLUTFrag = await fetch('./TransmittanceLUT.frag').then(r => r.text());
const MultiScatteredLuminanceLUTFrag = await fetch('./MultiScatteredLuminanceLUT.frag').then(r => r.text());
const SkyViewLUTFrag = await fetch('./SkyViewLUT.frag').then(r => r.text());
const SkyAtmosphereFrag = await fetch('./SkyAtmosphere.frag').then(r => r.text());
const ColorLookupTableFrag = await fetch('./ColorLookupTable.frag').then(r => r.text());


const { createTexture, createFramebuffer, draw, clear, setState, createVAO } = ToyGL;
const { Cartesian3, Cartesian4, Matrix3, Matrix4 } = ToyGL;

function createRGBA32FTexture(gl, width, height) {
  return createTexture(gl, {
    width: width,
    height: height,
    internalFormat: gl.RGBA,
    format: gl.RGBA,
    type: gl.FLOAT,
    data: null,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
    wrapS: gl.CLAMP_TO_EDGE,
    wrapT: gl.CLAMP_TO_EDGE,
  });
}

/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @param {*} framebuffer 
 * @param {*} texture 
 */
function bindAttachmentToFramebuffer(gl, framebuffer, texture) {
  const originalFramebuffer =  gl.getParameter(gl.FRAMEBUFFER_BINDING);
  const originalTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('createFramebuffer: framebuffer combination is NOT completed! Current status is ' + status + '.');
  }

  gl.bindTexture(gl.TEXTURE_2D, originalTexture);
  gl.bindFramebuffer(gl.FRAMEBUFFER, originalFramebuffer);
}

function createSizeAndInvSize(width, height) {
  return new Cartesian4(width, height, 1/width, 1/height);
}

function getSkyViewLutReferential(viewPos, viewForward, viewRight) {
  const up = Cartesian3.normalize(viewPos, new Cartesian3());
  const left = Cartesian3.cross(up, viewForward, new Cartesian3());

  if (Cartesian3.dot(viewForward, up) > 0.999) {
    Cartesian3.negative(viewRight, left);
  }

  const forward = Cartesian3.cross(left, up, new Cartesian3());

  const result = new Matrix3();
  Matrix3.setColumn(result, 0, forward, result);
  Matrix3.setColumn(result, 1, left, result);
  Matrix3.setColumn(result, 2, up, result);

  return result;
}

function createGroundRadiusMMFunction(skyAtmosphere) {
  return function() {
    return skyAtmosphere.groundRadiusMM;
  };
}
function createAtmosphereRadiusMMFunction(skyAtmosphere) {
  return function() {
    return skyAtmosphere.atmosphereRadiusMM;
  };
}

function createUniformSphereSamples(sampleCount) {
  const dest = [];
  dest.length = sampleCount * sampleCount;

  const sampleCountInv = 1.0 / sampleCount;
  for (let i = 0; i < sampleCount; i++) {
    for (let j = 0; j < sampleCount; j++) {
      const u0 = (i + Math.random()) * sampleCountInv;
      const u1 = (j + Math.random()) * sampleCountInv;

      const a = 1 - 2 * u0;
      const b = Math.sqrt(1 - a*a);
      const phi = 2 * Math.PI * u1;

      const idx = j*sampleCount + i;
      dest[idx] = [
        b * Math.cos(phi),
        b * Math.sin(phi),
        a,
        0,
      ];
    }
  }

  return dest.flat();
}

function createViewPositionFunction(skyAtmosphere) {
  return function() {
    return skyAtmosphere._viewPosition;
  };
}

function createInvViewProjectionMatrixFunction(skyAtmosphere) {
  return function() {
    return skyAtmosphere._invViewProjectionMatrix;
  };
}

function createSkyViewLutReferentialFunction(skyAtmosphere) {
  return function() {
    return getSkyViewLutReferential(skyAtmosphere._viewPosition, skyAtmosphere._viewDirection, skyAtmosphere._viewRight);
  };
}

function createTransmittanceLutTextureFunction(skyAtmosphere) {
  return function() {
    return skyAtmosphere._transmittanceLutTexture;
  };
}

function createReturnObjectPropertyFunction(obj, property) {
  return function() {
    return obj[property];
  };
}

function createColorGradingLutTextureFunction(skyAtmosphere) {
  return function() {
    return skyAtmosphere._colorGradingLutTexture;
  };
}

function createAtmosphereLightDirectionFunction(skyAtmosphere) {
  return function() {
    const atmosphereLightDirection0 = skyAtmosphere.atmosphereLightDirection0;
    const atmosphereLightDirection1 = skyAtmosphere.atmosphereLightDirection1;
    return [
      atmosphereLightDirection0.x, atmosphereLightDirection0.y, atmosphereLightDirection0.z,
      atmosphereLightDirection1.x, atmosphereLightDirection1.y, atmosphereLightDirection1.z,
    ];
  };
}

function createAtmosphereLightColor(skyAtmosphere) {
  return function() {
    const atmosphereLightColor0 = skyAtmosphere.atmosphereLightColor0;
    const atmosphereLightColor1 = skyAtmosphere.atmosphereLightColor1;
    return [
      atmosphereLightColor0.x, atmosphereLightColor0.y, atmosphereLightColor0.z, atmosphereLightColor0.w,
      atmosphereLightColor1.x, atmosphereLightColor1.y, atmosphereLightColor1.z, atmosphereLightColor1.w,
    ];
  };
}

function createAtmosphereLightDiscCosHalfApexAngleFunction(skyAtmosphere) {
  return function() {
    return [
      skyAtmosphere.atmosphereLightDiscCosHalfApexAngle0,
      skyAtmosphere.atmosphereLightDiscCosHalfApexAngle1,
    ];
  };
}

function createAtmosphereLightDiscLuminance(skyAtmosphere) {
  return function() {
    const atmosphereLightDiscLuminance0 = skyAtmosphere.atmosphereLightDiscLuminance0;
    const atmosphereLightDiscLuminance1 = skyAtmosphere.atmosphereLightDiscLuminance1;
    return [
      atmosphereLightDiscLuminance0.x, atmosphereLightDiscLuminance0.y, atmosphereLightDiscLuminance0.z,
      atmosphereLightDiscLuminance1.x, atmosphereLightDiscLuminance1.y, atmosphereLightDiscLuminance1.z,
    ];
  };
}


const EarthBottomRadius = 6360;
const EarthTopRadius = 6420;
const EarthRayleighScaleHeight = 8;
const EarthMieScaleHeight = 1.2;
// Apex angle == angular diameter
const SunOnEarthApexAngleDegree = 0.531;
const MoonOnEarthApexAngleDegree = 0.524;


/**
 * 
 * @param {WebGLRenderingContext} gl 
 * 
 * @example
 * const skyAtmosphere = new SkyAtmosphere(gl);
 * 
 * At render function:
 *   skyAtmosphere.renderSkyAtmosphereLookUpTables();
 *   skyAtmosphere.renderSkyAtmosphere();
 */
function SkyAtmosphere(gl) {
  this._TRANSMITTANCE_LUT_WIDTH = 256;
  this._TRANSMITTANCE_LUT_HEIGHT = 64;
  this._MULTI_SCATTERED_LUMINANCE_LUT_WIDTH = 200;
  this._MULTI_SCATTERED_LUMINANCE_LUT_HEIGHT = 200;
  this._DISTANT_SKY_LIGHT_LUT_WIDTH = 1;
  this._DISTANT_SKY_LIGHT_LUT_HEIGHT = 1;
  this._SKY_VIEW_LUT_WIDTH = 200;
  this._SKY_VIEW_LUT_HEIGHT = 200;

  this._gl = gl;
  this._LUTDirty = false;

  this._transmittanceLutTexture = undefined;
  this._multiScatteredLuminanceLutTexture = undefined;
  this._distantSkyLightLutTexture = undefined;
  this._skyViewLutTexture = undefined;
  this._skyAtmosphereLuminanceTexture = undefined;

  this._colorGradingLutTexture = undefined;
  const hdrImage = new HDRImage();
  hdrImage.src = './LUT.hdr';
  hdrImage.onload = () => {
    this._colorGradingLutTexture = createTexture(gl, {
      width: hdrImage.width,
      height: hdrImage.height,
      internalFormat: gl.RGB,
      format: gl.RGB,
      type: gl.FLOAT,
      data: hdrImage.dataFloat,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    });
  };

  this._ndcQuadVAO = undefined;
  this._framebuffer = undefined;

  this._viewPosition = new Cartesian3();
  this._viewDirection = new Cartesian3();
  // this._viewUp = new Cartesian3();
  this._viewRight = new Cartesian3();
  // this._viewMatrix = new Matrix4();
  // this._invViewMatrix = new Matrix4();
  // this._projectionMatrix = new Matrix4();
  // this._invProjectionMatrix = new Matrix4();
  this._invViewProjectionMatrix = new Matrix4();
  this._viewport = new Cartesian4();


  // this.rayleighExponentialDistribution = EarthRayleighScaleHeight;
  // this.mieExponentialDistribution = EarthMieScaleHeight;
  // this.atmosphere = {
  //   bottomRadiusKm: 6360,
  //   topRadiusKm: 6360,
  //   groundAlbedo: new Cartesian3(),
  //   rayleighDensityExpScale: -1 / this.rayleighExponentialDistribution,
  //   // unit: 1/km
  //   rayleighScattering: new Cartesian3(0.005802, 0.013558, 0.033100),
  //   rayleighAbsorption: new Cartesian3(0, 0, 0),
  //   mieDensityExpScale: -1 / this.mieExponentialDistribution,
  //   mieScattering: new Cartesian3(0.003996, 0.003996, 0.003996),
  //   mieAbsorption: new Cartesian3(0.00440, 0.00440, 0.00440),
  //   miePhaseG: 0.8,
  //   // Earth case: ozone
  //   otherScattering: new Cartesian3(0, 0, 0),
  //   otherAbsorption: new Cartesian3(0.000650, 0.001881, 0.000085),
  //   otherTentDensityDescription: 0,
  // };

  this.groundRadiusMM = 6.360;
  this.atmosphereRadiusMM = 6.420;

  // this.sunDir = new Cartesian3();
  this.atmosphereLightDirection0 = new Cartesian3(0, 0, 1).normalize();
  this.atmosphereLightDirection1 = new Cartesian3(0, 0, -1).normalize();

  const atmosphereLightIntensity0 = 4.65;
  this.atmosphereLightColor0 = new Cartesian4(
    1 * atmosphereLightIntensity0,
    1 * atmosphereLightIntensity0,
    1 * atmosphereLightIntensity0,
    1);
  const atmosphereLightIntensity1 = 0.16;
  this.atmosphereLightColor1 = new Cartesian4(
    0.55834 * atmosphereLightIntensity1,
    0.630757 * atmosphereLightIntensity1,
    0.863157 * atmosphereLightIntensity1,
    1);

  this.atmosphereLightDiscCosHalfApexAngle0 = Math.cos(0.5 * SunOnEarthApexAngleDegree / 180 * Math.PI);
  this.atmosphereLightDiscCosHalfApexAngle1 = Math.cos(0.5 * MoonOnEarthApexAngleDegree / 180 * Math.PI);
  this.atmosphereLightDiscLuminance0 = new Cartesian3(4.65, 4.65, 4.65);
  this.atmosphereLightDiscLuminance1 = new Cartesian3(0.16, 0.16, 0.16);

  const skyAtmosphere = this;
  this.uniforms = {
    uTransmittanceLutSizeAndInvSize: createSizeAndInvSize(skyAtmosphere._TRANSMITTANCE_LUT_WIDTH, skyAtmosphere._TRANSMITTANCE_LUT_HEIGHT),
    uMultiScatteredLuminanceLutSizeAndInvSize: createSizeAndInvSize(skyAtmosphere._MULTI_SCATTERED_LUMINANCE_LUT_WIDTH, skyAtmosphere._MULTI_SCATTERED_LUMINANCE_LUT_HEIGHT),
    uSkyViewLutSizeAndInvSize: createSizeAndInvSize(skyAtmosphere._SKY_VIEW_LUT_WIDTH, skyAtmosphere._SKY_VIEW_LUT_HEIGHT),

    uGroundRadiusMM: createGroundRadiusMMFunction(skyAtmosphere),
    uAtmosphereRadiusMM: createAtmosphereRadiusMMFunction(skyAtmosphere),
    uUniformSphereSamplesBuffer: createUniformSphereSamples(8),

    uTransmittance: createTransmittanceLutTextureFunction(skyAtmosphere),
    uMultiscattering: createReturnObjectPropertyFunction(skyAtmosphere, '_multiScatteredLuminanceLutTexture'),
    uSkyView: createReturnObjectPropertyFunction(skyAtmosphere, '_skyViewLutTexture'),
    uColorGradingLutTexture: createColorGradingLutTextureFunction(skyAtmosphere),

    // 和 uEyePos 不同，viewPos 的 xy 总是 0
    // viewPos: createViewPositionFunction(skyAtmosphere),
    uSkyViewLutReferential: createSkyViewLutReferentialFunction(skyAtmosphere),

    uViewport: createReturnObjectPropertyFunction(skyAtmosphere, '_viewport'),
    uInvViewProjection: createInvViewProjectionMatrixFunction(skyAtmosphere),
    uEyePos: createViewPositionFunction(skyAtmosphere),

    uAtmosphereLightDirection: createAtmosphereLightDirectionFunction(skyAtmosphere),
    uAtmosphereLightColor: createAtmosphereLightColor(skyAtmosphere),

    uAtmosphereLightDiscCosHalfApexAngle: createAtmosphereLightDiscCosHalfApexAngleFunction(skyAtmosphere),
    uAtmosphereLightDiscLuminance: createAtmosphereLightDiscLuminance(skyAtmosphere)
  };
}

SkyAtmosphere.prototype.createResources = function() {
  const gl = this._gl;

  if (!this._transmittanceLutTexture) {
    this._transmittanceLutTexture = createRGBA32FTexture(gl, this._TRANSMITTANCE_LUT_WIDTH, this._TRANSMITTANCE_LUT_HEIGHT);
  }
  if (!this._multiScatteredLuminanceLutTexture) {
    this._multiScatteredLuminanceLutTexture = createRGBA32FTexture(gl, this._MULTI_SCATTERED_LUMINANCE_LUT_WIDTH, this._MULTI_SCATTERED_LUMINANCE_LUT_HEIGHT);
  }
  if (!this._distantSkyLightLutTexture) {
    this._distantSkyLightLutTexture = createRGBA32FTexture(gl, this._DISTANT_SKY_LIGHT_LUT_WIDTH, this._DISTANT_SKY_LIGHT_LUT_HEIGHT);
  }
  if (!this._skyViewLutTexture) {
    this._skyViewLutTexture = createRGBA32FTexture(gl, this._SKY_VIEW_LUT_WIDTH, this._SKY_VIEW_LUT_HEIGHT);
  }

  if (!this._ndcQuadVAO) {
    this._ndcQuadVAO = createVAO(gl, {
      attributes: {
        a_position: {
          location: 0,
          size: 2,
          data: [
            -1, -1,
            1, -1,
            -1,  1,
            1,  1,
          ]
        },
      },
      indices: [0, 1, 2, 1, 2, 3],
    });
  }

  if (!this._framebuffer) {
    this._framebuffer = gl.createFramebuffer();
  }
};


SkyAtmosphere.prototype.renderSkyAtmosphereLookUpTables = function() {
  this.createResources();

  const gl = this._gl;

  // Transmittance LUT
  {
    bindAttachmentToFramebuffer(gl, this._framebuffer, this._transmittanceLutTexture);
    setState(gl, {
      viewport: [0, 0, this._TRANSMITTANCE_LUT_WIDTH, this._TRANSMITTANCE_LUT_HEIGHT],
      cull: {
        enable: false,
      },
    });
    draw(gl, {
      vs: NormalizedQuadVert,
      fs: `
        precision highp float;
        ${CommonFrag}
        ${TransmittanceLUTFrag}
      `,
      attributeLocations: {
        a_position: 0,
      },
      uniforms: this.uniforms,
      vao: this._ndcQuadVAO,
      count: 6,
      fb: this._framebuffer,
    });
  }

  // Multi-scattered LUT
  {
    bindAttachmentToFramebuffer(gl, this._framebuffer, this._multiScatteredLuminanceLutTexture);
    setState(gl, {
      viewport: [0, 0, this._MULTI_SCATTERED_LUMINANCE_LUT_WIDTH, this._MULTI_SCATTERED_LUMINANCE_LUT_HEIGHT],
      cull: {
        enable: false,
      },
    });
    draw(gl, {
      vs: NormalizedQuadVert,
      fs: `
        precision highp float;
        ${CommonFrag}
        ${MultiScatteredLuminanceLUTFrag}
      `,
      attributeLocations: {
        a_position: 0,
      },
      uniforms: this.uniforms,
      vao: this._ndcQuadVAO,
      count: 6,
      fb: this._framebuffer,
    });
  }

  // Sky View LUT
  {
    bindAttachmentToFramebuffer(gl, this._framebuffer, this._skyViewLutTexture);
    ToyGL.setState(gl, {
      viewport: [0, 0, this._SKY_VIEW_LUT_WIDTH, this._SKY_VIEW_LUT_HEIGHT],
      cull: {
        enable: false,
      },
    });
    ToyGL.draw(gl, {
      vs: `${NormalizedQuadVert}`,
      fs: `
        precision highp float;
        #define SECOND_ATMOSPHERE_LIGHT_ENABLED 1
        ${CommonFrag}
        ${SkyViewLUTFrag}
      `,
      attributeLocations: {
        a_position: 0,
      },
      uniforms: this.uniforms,
      vao: this._ndcQuadVAO,
      count: 6,
      fb: this._framebuffer,
    });
  }
};

/**
 * 
 * @param {Object} options 
 * @param {WebGLFramebuffer|undefined|null} options.framebuffer 
 * @param {Cartesian4} options.viewport 
 */
SkyAtmosphere.prototype.renderSkyAtmosphere = function(options) {
  if (!this._colorGradingLutTexture) {
    return;
  }

  const framebuffer = options.framebuffer;
  const viewport = options.viewport;
  viewport.clone(this._viewport);
  const width = viewport.z - viewport.x;
  const height = viewport.w - viewport.y;

  const gl = this._gl;

  if (!this._skyAtmosphereLuminanceTexture ||
    this._skyAtmosphereLuminanceTexture.width !== width ||
    this._skyAtmosphereLuminanceTexture.height !== height
  ) {
    if (this._skyAtmosphereLuminanceTexture) {
      gl.deleteTexture(this._skyAtmosphereLuminanceTexture);
    }

    this._skyAtmosphereLuminanceTexture = createRGBA32FTexture(gl, width, height);
    this._skyAtmosphereLuminanceTexture.width = width;
    this._skyAtmosphereLuminanceTexture.height = height;
  }

  // SkyAtmosphere Luminance
  {
    bindAttachmentToFramebuffer(gl, this._framebuffer, this._skyAtmosphereLuminanceTexture);
    ToyGL.setState(gl, {
      viewport: Array.from(viewport),
    });
    ToyGL.clear(gl, {
      color: [0, 0, 0, 1],
      depth: 1,
      // fb: framebuffer,
      fb: this._framebuffer,
    });
    ToyGL.draw(gl, {
      vs: `
        #define StartDepthZ 0.1
        ${NormalizedQuadVert}
      `,
      fs: `
        precision highp float;
        #define SECOND_ATMOSPHERE_LIGHT_ENABLED 1
        ${CommonFrag}
        ${ColorLookupTableFrag}
        ${SkyAtmosphereFrag}
      `,
      attributeLocations: {
        a_position: 0,
      },
      uniforms: this.uniforms,
      vao: this._ndcQuadVAO,
      count: 6,
      fb: framebuffer,
      // fb: this._framebuffer,
    });
  }

  // Bloom
  {

  }

  // Tone mapping
  {

  }
};

SkyAtmosphere.prototype.destroy = function() {
  const gl = this._gl;
  if (this._transmittanceLutTexture) {
    gl.deleteTexture(this._transmittanceLutTexture);
  }
  if (this._multiScatteredLuminanceLutTexture) {
    gl.deleteTexture(this._multiScatteredLuminanceLutTexture);
  }
  if (this._distantSkyLightLutTexture) {
    gl.deleteTexture(this._distantSkyLightLutTexture);
  }
  if (this._skyViewLutTexture) {
    gl.deleteTexture(this._skyViewLutTexture);
  }

  if (this._ndcQuadVAO) {
    gl.deleteVertexArray(this._ndcQuadVAO);
  }

  if (this._framebuffer) {
    gl.deleteFramebuffer(this._framebuffer);
  }
};

export default SkyAtmosphere;
