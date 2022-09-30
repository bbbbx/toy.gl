const NormalizedQuadVert = await fetch('./NormalizedQuad.vert').then(r => r.text());
const CommonFrag = await fetch('./Common.frag').then(r => r.text());
const TransmittanceLUTFrag = await fetch('./TransmittanceLUT.frag').then(r => r.text());
const MultiScatteredLuminanceLUTFrag = await fetch('./MultiScatteredLuminanceLUT.frag').then(r => r.text());
const DistantSkyLightLUTFrag = await fetch('./DistantSkyLightLUT.frag').then(r => r.text());
const SkyViewLUTFrag = await fetch('./SkyViewLUT.frag').then(r => r.text());
const SkyAtmosphereVert = await fetch('./SkyAtmosphere.vert').then(r => r.text());
const SkyAtmosphereFrag = await fetch('./SkyAtmosphere.frag').then(r => r.text());
const ColorLookupTableFrag = await fetch('./ColorLookupTable.frag').then(r => r.text());
const BloomSetupVert = await fetch('./BloomSetup.vert').then(r => r.text());
const BloomSetupFrag = await fetch('./BloomSetup.frag').then(r => r.text());
const TonemapFrag = await fetch('./Tonemap.frag').then(r => r.text());

import defined from '../../src/defined.js';
import MMath from '../../src/Math/Math.js';
import DownsampleChain from './DownsampleChain/DownsampleChain.js';
import StarField from './StarField/StarField.js';

const { createTexture, createFramebuffer, draw, clear, setState, createVAO } = ToyGL;
const { Cartesian2, Cartesian3, Cartesian4, Matrix3, Matrix4 } = ToyGL;

function createRGBA32FTexture(gl, width, height) {
  return createTexture(gl, {
    width: width,
    height: height,
    format: gl.RGBA,
    type: gl.FLOAT,
    internalFormat: (gl instanceof WebGL2RenderingContext) ? gl.RGBA32F : gl.RGBA,
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

  // const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  // if (status !== gl.FRAMEBUFFER_COMPLETE) {
  //   throw new Error('createFramebuffer: framebuffer combination is NOT completed! Current status is ' + status + '.');
  // }

  gl.bindTexture(gl.TEXTURE_2D, originalTexture);
  gl.bindFramebuffer(gl.FRAMEBUFFER, originalFramebuffer);
}

function createSizeAndInvSize(width, height) {
  return new Cartesian4(width, height, 1/width, 1/height);
}

function getSkyViewLutReferential(cameraPosition, cameraDirection, cameraRight) {
  const up = Cartesian3.normalize(cameraPosition, new Cartesian3());
  const left = Cartesian3.cross(up, cameraDirection, new Cartesian3());

  if (Cartesian3.dot(cameraDirection, up) > 0.999) {
    Cartesian3.negate(cameraRight, left);
  }

  const forward = Cartesian3.cross(left, up, new Cartesian3());

  const result = new Matrix3();
  Matrix3.setColumn(result, 0, forward, result);
  Matrix3.setColumn(result, 1, left, result);
  Matrix3.setColumn(result, 2, up, result);


  // Matrix3.transpose(result, result);
  // Matrix3.inverse(result, result);

  return result;
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

function createSkyViewLutReferentialFunction(skyAtmosphere) {
  return function() {
    return getSkyViewLutReferential(skyAtmosphere._cameraPosition, skyAtmosphere._cameraDirection, skyAtmosphere._cameraRight);
  };
}

function createReturnObjectPropertyFunction(obj, property) {
  return function() {
    return obj[property];
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
    const light0Intensity = skyAtmosphere.atmosphereLightIntensity0;
    const light1Intensity = skyAtmosphere.atmosphereLightIntensity1;
    return [
      atmosphereLightColor0.x * light0Intensity, atmosphereLightColor0.y * light0Intensity, atmosphereLightColor0.z * light0Intensity, atmosphereLightColor0.w,
      atmosphereLightColor1.x * light1Intensity, atmosphereLightColor1.y * light1Intensity, atmosphereLightColor1.z * light1Intensity, atmosphereLightColor1.w,
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


const EarthBottomRadiusKm = 6360;
const EarthTopRadiusKm = 6420;
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
  // this._brightStarCatalogTexture = undefined;
  // this._brightStarCatalogVAO = undefined;
  this._starField = new StarField(gl);
  this._bloomTexture = undefined;
  this._depthTexture = undefined;
  this._sceneColorTexture = undefined;

  this._skyAtmosphereLuminanceHalfResolutionTexture = undefined;
  this._downsampleInputTexture = undefined;
  this._bloomDownsampleChain = new DownsampleChain();
  this._bloomHorizontalOutputTextures = [];
  this._bloomOutputTextures = [];

  this._colorGradingLutTexture = undefined;
  const hdrImage = new HDRImage();
  hdrImage.src = './LUT.hdr';
  hdrImage.onload = () => {
    this._colorGradingLutTexture = createTexture(gl, {
      width: hdrImage.width,
      height: hdrImage.height,
      format: gl.RGB,
      type: gl.FLOAT,
      internalFormat: (gl instanceof WebGL2RenderingContext) ? gl.RGB32F : gl.RGB,
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

  this._cameraPosition = new Cartesian3();
  this._cameraDirection = new Cartesian3();
  // this._viewUp = new Cartesian3();
  this._cameraRight = new Cartesian3();
  // this._viewMatrix = new Matrix4();
  // this._invViewMatrix = new Matrix4();
  // this._projectionMatrix = new Matrix4();
  // this._invProjectionMatrix = new Matrix4();
  this._invViewProjectionMatrix = new Matrix4();
  this._viewport = new Cartesian4();

  this._topLeft = new Cartesian3();
  this._topRight = new Cartesian3();
  this._bottomLeft = new Cartesian3();
  this._bottomRight = new Cartesian3();


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

  this.groundRadiusMM = EarthBottomRadiusKm / 1e3;
  this.atmosphereRadiusMM = EarthTopRadiusKm / 1e3;
  this._distantSkyLightSampleAltitude = 6 * 1e-3; // 6km

  // -1:2x darker, -2:4x darker, 1:2x brighter, 2:4x brighter, ...
  this._autoExposureBias = 0;

  this.atmosphereLightDirection0 = new Cartesian3(0, 0, 1).normalize();
  this.atmosphereLightDirection1 = new Cartesian3(0, 0, -1).normalize();

  this.atmosphereLightIntensity0 = 5.3;
  this.atmosphereLightColor0 = new Cartesian4(1, 1, 1, 1);
  this.atmosphereLightIntensity1 = 0.036;
  this.atmosphereLightColor1 = new Cartesian4(0.55834, 0.630757, 0.863157, 1);

  this.atmosphereLightDiscCosHalfApexAngle0 = Math.cos(0.5 * SunOnEarthApexAngleDegree / 180 * Math.PI);
  this.atmosphereLightDiscCosHalfApexAngle1 = Math.cos(0.5 * MoonOnEarthApexAngleDegree / 180 * Math.PI);
  this.atmosphereLightDiscLuminance0 = new Cartesian3(5000, 5000, 5000);
  this.atmosphereLightDiscLuminance1 = new Cartesian3(0.16, 0.16, 0.16);

  const skyAtmosphere = this;
  this.uniforms = {
    uTransmittanceLutSizeAndInvSize: createSizeAndInvSize(skyAtmosphere._TRANSMITTANCE_LUT_WIDTH, skyAtmosphere._TRANSMITTANCE_LUT_HEIGHT),
    uMultiScatteredLuminanceLutSizeAndInvSize: createSizeAndInvSize(skyAtmosphere._MULTI_SCATTERED_LUMINANCE_LUT_WIDTH, skyAtmosphere._MULTI_SCATTERED_LUMINANCE_LUT_HEIGHT),
    uSkyViewLutSizeAndInvSize: createSizeAndInvSize(skyAtmosphere._SKY_VIEW_LUT_WIDTH, skyAtmosphere._SKY_VIEW_LUT_HEIGHT),

    uGroundRadiusMM: createReturnObjectPropertyFunction(skyAtmosphere, 'groundRadiusMM'),
    uAtmosphereRadiusMM: createReturnObjectPropertyFunction(skyAtmosphere, 'atmosphereRadiusMM'),
    uUniformSphereSamplesBuffer: createUniformSphereSamples(8),

    uTransmittanceLutTexture: createReturnObjectPropertyFunction(skyAtmosphere, '_transmittanceLutTexture'),
    uMultiScatteredLuminanceLutTexture: createReturnObjectPropertyFunction(skyAtmosphere, '_multiScatteredLuminanceLutTexture'),
    uDistantSkyLightLutTexture: createReturnObjectPropertyFunction(skyAtmosphere, '_distantSkyLightLutTexture'),
    uSkyViewLutTexture: createReturnObjectPropertyFunction(skyAtmosphere, '_skyViewLutTexture'),
    // uColorGradingLutTexture: createReturnObjectPropertyFunction(skyAtmosphere, '_colorGradingLutTexture'),

    // 和 uEyePos 不同，viewPos 的 xy 总是 0
    // viewPos: createViewPositionFunction(skyAtmosphere),
    uSkyViewLutReferential: createSkyViewLutReferentialFunction(skyAtmosphere),

    uViewport: createReturnObjectPropertyFunction(skyAtmosphere, '_viewport'),
    uInvViewProjection: createReturnObjectPropertyFunction(skyAtmosphere, '_invViewProjectionMatrix'),
    uViewPos: createReturnObjectPropertyFunction(skyAtmosphere, '_viewPosition'),
    uDistantSkyLightSampleAltitude: createReturnObjectPropertyFunction(skyAtmosphere, '_distantSkyLightSampleAltitude'),
    // uDistantSkyLightSampleAltitude: function() {
    //   return Math.max(skyAtmosphere._viewPosition.z - skyAtmosphere.groundRadiusMM, 1*1e-3);
    // },

    uAtmosphereLightDirection: createAtmosphereLightDirectionFunction(skyAtmosphere),
    uAtmosphereLightColor: createAtmosphereLightColor(skyAtmosphere),

    uAtmosphereLightDiscCosHalfApexAngle: createAtmosphereLightDiscCosHalfApexAngleFunction(skyAtmosphere),
    uAtmosphereLightDiscLuminance: createAtmosphereLightDiscLuminance(skyAtmosphere),

    uStarFieldTexture: createReturnObjectPropertyFunction(skyAtmosphere._starField, 'starFieldTexture'),

    // Tonemapping
    uColorTexture: createReturnObjectPropertyFunction(skyAtmosphere, '_skyAtmosphereLuminanceTexture'),
    uBloomTexture: createReturnObjectPropertyFunction(skyAtmosphere, '_bloomTexture'),
    uColorGradingLutTexture: createReturnObjectPropertyFunction(skyAtmosphere, '_colorGradingLutTexture'),
    uColorScale0: new Cartesian4(1, 1, 1, 1),
    uColorScale1: new Cartesian4(BloomIntensity, BloomIntensity, BloomIntensity, BloomIntensity),
    uAutoExposureBias: createReturnObjectPropertyFunction(skyAtmosphere, '_autoExposureBias'),

    uMilkWayTexture: function() {
      return './milkyway.png';
    },

    uTopLeft: createReturnObjectPropertyFunction(skyAtmosphere, '_topLeft'),
    uTopRight: createReturnObjectPropertyFunction(skyAtmosphere, '_topRight'),
    uBottomLeft: createReturnObjectPropertyFunction(skyAtmosphere, '_bottomLeft'),
    uBottomRight: createReturnObjectPropertyFunction(skyAtmosphere, '_bottomRight'),

    uDepthTexture: createReturnObjectPropertyFunction(skyAtmosphere, '_depthTexture'),
    uSceneColorTexture: createReturnObjectPropertyFunction(skyAtmosphere, '_sceneColorTexture'),
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
  if (!gl._ndcQuadVAO) {
    gl._ndcQuadVAO = this._ndcQuadVAO;
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

  // Distant Sky Light LUT
  {
    bindAttachmentToFramebuffer(gl, this._framebuffer, this._distantSkyLightLutTexture);
    ToyGL.setState(gl, {
      viewport: [0, 0, this._DISTANT_SKY_LIGHT_LUT_WIDTH, this._DISTANT_SKY_LIGHT_LUT_HEIGHT],
      cull: {
        enable: false,
      },
    });
    ToyGL.draw(gl, {
      vs: `${NormalizedQuadVert}`,
      fs: `
        precision highp float;
        #define SECOND_ATMOSPHERE_LIGHT_ENABLED 1
        #define RAY_MARCHING_SAMPLE_COUNT 32
        ${CommonFrag}
        ${DistantSkyLightLUTFrag}
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
        #define RAY_MARCHING_SAMPLE_COUNT 32
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
    // this._bloomTexture = createRGBA32FTexture(gl, width, height);

    if (this._skyAtmosphereLuminanceHalfResolutionTexture) {
      gl.deleteTexture(this._skyAtmosphereLuminanceHalfResolutionTexture);
    }

    const halfWidth = Math.round(width / 2);
    const halfHeight = Math.round(height / 2);
    this._skyAtmosphereLuminanceHalfResolutionTexture = createRGBA32FTexture(gl, halfWidth, halfHeight);
    this._skyAtmosphereLuminanceHalfResolutionTexture.width = halfWidth;
    this._skyAtmosphereLuminanceHalfResolutionTexture.height = halfHeight;
    this._skyAtmosphereLuminanceHalfResolutionTexture.format = gl.RGBA;
    this._skyAtmosphereLuminanceHalfResolutionTexture.type = gl.FLOAT;
    this._skyAtmosphereLuminanceHalfResolutionTexture.internalFormat = (gl instanceof WebGL2RenderingContext) ? gl.RGBA32F : gl.RGBA;

    this._downsampleInputTexture = createRGBA32FTexture(gl, halfWidth, halfHeight);
    this._downsampleInputTexture.width = halfWidth;
    this._downsampleInputTexture.height = halfHeight;
    this._downsampleInputTexture.format = gl.RGBA;
    this._downsampleInputTexture.type = gl.FLOAT;
    this._downsampleInputTexture.internalFormat = (gl instanceof WebGL2RenderingContext) ? gl.RGBA32F : gl.RGBA;
  }


  // return;

  // SkyAtmosphere Luminance
  {
    bindAttachmentToFramebuffer(gl, this._framebuffer, this._skyAtmosphereLuminanceTexture);
    ToyGL.setState(gl, {
      viewport: Array.from(viewport),
    });
    ToyGL.clear(gl, {
      color: [0, 0, 0, 1],
      depth: 1,
      fb: this._framebuffer,
    });
    ToyGL.draw(gl, {
      vs: `
        #define StartDepthZ 0.1
        ${SkyAtmosphereVert}
      `,
      fs: `
        precision highp float;
        #define SECOND_ATMOSPHERE_LIGHT_ENABLED 1
        #define RAY_MARCHING_SAMPLE_COUNT 16
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
      fb: this._framebuffer,
    });
  }

  // Half Resolution for scene color
  {
    bindAttachmentToFramebuffer(gl, this._framebuffer, this._skyAtmosphereLuminanceHalfResolutionTexture);
    ToyGL.setState(gl, {
      viewport: [0, 0, this._skyAtmosphereLuminanceHalfResolutionTexture.width, this._skyAtmosphereLuminanceHalfResolutionTexture.height],
    });
    ToyGL.clear(gl, {
      color: [0, 0, 0, 1],
      depth: 1,
      fb: this._framebuffer,
    });
    ToyGL.draw(gl, {
      vs: NormalizedQuadVert,
      fs: `
        precision highp float;
        varying vec2 uv;
        uniform sampler2D InputTexture;
        void main() {
          gl_FragColor = texture2D(InputTexture, uv);
        }
      `,
      attributeLocations: {
        a_position: 0,
      },
      uniforms: {
        InputTexture: this._skyAtmosphereLuminanceTexture,
      },
      vao: this._ndcQuadVAO,
      count: 6,
      fb: this._framebuffer,
    });
  }

  // Bloom
  {
    // AddBloomSetupPass
    {
      // const sceneColor = downsampleInput;
      const eyeAdaptation = 1.0;

      // downsampleInput = AddBloomSetupPass;
      bindAttachmentToFramebuffer(gl, this._framebuffer, this._downsampleInputTexture);
      ToyGL.setState(gl, {
        viewport: [0, 0, this._downsampleInputTexture.width, this._downsampleInputTexture.height],
      });
      ToyGL.clear(gl, {
        color: [0, 0, 0, 1],
        depth: 1,
        fb: this._framebuffer,
      });
      ToyGL.draw(gl, {
        vs: NormalizedQuadVert,
        fs: BloomSetupFrag,
        attributeLocations: {
          a_position: 0,
        },
        uniforms: {
          InputTexture: this._skyAtmosphereLuminanceHalfResolutionTexture,
          eyeAdaptation: eyeAdaptation,
          BloomThreshold: BloomThreshold,
        },
        vao: this._ndcQuadVAO,
        count: 6,
        fb: this._framebuffer,
      });
    }

    // Bloom Downsample
    const bloomDownsampleChain = this._bloomDownsampleChain;
    {
      bloomDownsampleChain.initTextures(gl, this._downsampleInputTexture);
      bloomDownsampleChain.downsample();

      // passInputs.SceneDownsampleChain = bloomDownsampleChain;
    }

    // Bloom pass
    {
      // AddBloomPass(downsampleInput, passInputs)
      // Gauss filter and composite
      // Input: (SceneColor, SceneDownsampleChain)
      // Output: this._bloomTexture
      this._bloomTexture = this.addBloomPass(gl, this._skyAtmosphereLuminanceTexture, this._bloomDownsampleChain);
    }
    // bloomDownsampleChain.destroy();
  }

  // Tone mapping
  // (this._skyAtmosphereLuminanceTexture, bloom, eyeAdaptation, colorGrading) => 
  {
    ToyGL.setState(gl, {
      viewport: [0, 0, width, height],
      depthTest: {
        enable: false,
        write: false,
      },
    });
    ToyGL.clear(gl, {
      color: [0, 0, 0, 1],
      depth: 1,
      fb: framebuffer,
    });
    ToyGL.draw(gl, {
      vs: NormalizedQuadVert,
      fs: `
        precision highp float;
        ${ColorLookupTableFrag}
        ${TonemapFrag}
      `,
      attributeLocations: {
        a_position: 0,
      },
      uniforms: this.uniforms,
      vao: this._ndcQuadVAO,
      count: 6,
      fb: framebuffer,
    });
  }

  // gl.deleteTexture(this._bloomTexture);
};

const Bloom6Size = 64.0;
const Bloom6Tint = new Cartesian4(0.061000, 0.061000, 0.061000, 1);
const Bloom5Size = 30.0;
const Bloom5Tint = new Cartesian4(0.066000, 0.066000, 0.066000, 1);
const Bloom4Size = 10.0;
const Bloom4Tint = new Cartesian4(0.066000, 0.066000, 0.066000, 1);
const Bloom3Size = 2.0;
const Bloom3Tint = new Cartesian4(0.117600, 0.117600, 0.117600, 1);
const Bloom2Size = 1.0;
const Bloom2Tint = new Cartesian4(0.138000, 0.138000, 0.138000, 1);
const Bloom1Size = 0.3;
const Bloom1Tint = new Cartesian4(0.346500, 0.346500, 0.346500, 1);
const BloomSizeScale = 8.0;
const SMALL_NUMBER = 1e-8;
const BloomIntensity = 4;
const BloomThreshold = -1.0; // [-1, 8]


SkyAtmosphere.prototype.addBloomPass = function(gl, sceneColorTexture, downsampleChain, outputTexture) {
  let bloom;

  const bloomStages = [
    { size: Bloom6Size, tint: Bloom6Tint },
    { size: Bloom5Size, tint: Bloom5Tint },
    { size: Bloom4Size, tint: Bloom4Tint },
    { size: Bloom3Size, tint: Bloom3Tint },
    { size: Bloom2Size, tint: Bloom2Tint },
    { size: Bloom1Size, tint: Bloom1Tint },
  ];

  const bloomQualityCountMax = downsampleChain.stageCount;
  const bloomStageCount = downsampleChain.stageCount;
  const tintScale = 1.0 / bloomQualityCountMax;

  for (let stageIndex = 0, sourceIndex = bloomQualityCountMax - 1; stageIndex < bloomStageCount; ++stageIndex, --sourceIndex) {
    const bloomStage = bloomStages[stageIndex];

    if (bloomStage.size > SMALL_NUMBER) {
      const filter = downsampleChain.textures[sourceIndex];
      const additive = bloom;
      // CVarBloomCross
      const crossBloom = 0.0;
      const crossCenterWeight = new Cartesian2( Math.max(crossBloom, 0.0), Math.abs(crossBloom) );
      const kernelSizePercent = bloomStage.size * BloomSizeScale;
      const tintColor = Cartesian4.multiplyByScalar(bloomStage.tint, tintScale, new Cartesian4());

      let horizontalOutputTexture;
      {
        const filterViewport = [ 0, 0, filter.width, filter.height ];
        const blurRadius = GetBlurRadius(filterViewport[2], kernelSizePercent);
        const sampleCountMax = 32;
        const inverseFilterTextureExtent = new Cartesian2( 1/filter.width, 1/filter.height );

        const bFastBlurEnabled = IsFastBlurEnabled(blurRadius);
        const horizontalOutputViewport = bFastBlurEnabled ?
          [0, 0, filterViewport[2]/2, filterViewport[3]/1 ] :
          filterViewport;

        // Horizontal Pass
        {
          const offsetAndWeight = [];
          const sampleWeights = [];
          const sampleOffsets = [];

          const sampleCount = Compute1DGaussianFilterKernel( offsetAndWeight, sampleCountMax, blurRadius, crossCenterWeight.x );
          for (let i = 0; i < sampleCount; ++i) {
            const offset = offsetAndWeight[i].x;
            const weight = offsetAndWeight[i].y;

            // Weights multiplied by a white tint.
            sampleWeights[i] = new Cartesian4(weight, weight, weight, weight);
            sampleOffsets[i] = new Cartesian2(inverseFilterTextureExtent.x * offset, 0.0);
          }

          // Horizontal pass doesn't use additive combine.
          const additive = undefined;
          if (!defined(this._bloomHorizontalOutputTextures[sourceIndex])) {
            this._bloomHorizontalOutputTextures[sourceIndex] = createRGBA32FTexture(gl, horizontalOutputViewport[2], horizontalOutputViewport[3]);
          }
          horizontalOutputTexture = this._bloomHorizontalOutputTextures[sourceIndex];
          AddGaussianBlurPass(
            gl,
            horizontalOutputViewport,
            filter,
            additive,
            sampleOffsets,
            sampleWeights,
            horizontalOutputTexture,
          );
        }

        // Vertical Pass
        {
          const offsetAndWeight = [];
          const sampleWeights = [];
          const sampleOffsets = [];

          const sampleCount = Compute1DGaussianFilterKernel( offsetAndWeight, sampleCountMax, blurRadius, crossCenterWeight.y );
          for (let i = 0; i < sampleCount; ++i) {
            const offset = offsetAndWeight[i].x;
            const weight = offsetAndWeight[i].y;

            // Weights multiplied by a input tint color.
            sampleWeights[i] = Cartesian4.multiplyByScalar(tintColor, weight, new Cartesian4());
            sampleOffsets[i] = new Cartesian2(0.0, inverseFilterTextureExtent.y * offset);
          }

          if (!defined(this._bloomOutputTextures[sourceIndex])) {
            this._bloomOutputTextures[sourceIndex] = createRGBA32FTexture(gl, filterViewport[2], filterViewport[3]);
          }
          bloom = this._bloomOutputTextures[sourceIndex];
          AddGaussianBlurPass(
            gl,
            filterViewport,
            horizontalOutputTexture,
            additive,
            sampleOffsets,
            sampleWeights,
            bloom,
          );

          // 
          // gl.deleteTexture(horizontalOutputTexture);
          // gl.deleteTexture(additive);
        }
      }
    }

  }

  return bloom;
}

let framebufferScratch = undefined;
function AddGaussianBlurPass (
  gl,
  outputViewport,
  filter,
  additive,
  sampleOffsets,
  sampleWeights,
  outputTexture
) {
  const bCombineAdditive = !!additive;
  const bManualUVBorder = false;

  const sampleCount = sampleOffsets.length;
  const staticSampleCount = sampleCount; // GetStaticSampleCount(SampleCount)
  const filterInput = filter;
  const additiveInput = bCombineAdditive ? additive : undefined;

  const shaderParameters = {};
  GetFilterParameters(shaderParameters, filterInput, additiveInput, sampleOffsets, sampleWeights);
  if (staticSampleCount !== 0) {
    if (!framebufferScratch) {
      framebufferScratch = gl.createFramebuffer();
    }
    const framebuffer = framebufferScratch;

    bindAttachmentToFramebuffer(gl, framebuffer, outputTexture);
    ToyGL.setState(gl, {
      viewport: outputViewport,
    });
    ToyGL.clear(gl, {
      color: [0, 0, 0, 0],
    });

    let unrolledLoop = '{\n';
    let sampleIndex = 0;
    for (; sampleIndex < staticSampleCount - 1; sampleIndex += 2) {
      unrolledLoop += `
        UVUV = InUV.xyxy + sampleOffsets[${sampleIndex / 2}];
        color += SampleFilterTexture(UVUV.xy) * sampleWeights[${sampleIndex + 0}];
        color += SampleFilterTexture(UVUV.zw) * sampleWeights[${sampleIndex + 1}];
      `;
    }
    unrolledLoop += '}\n';

    let branch = '';
    if (sampleIndex < staticSampleCount) {
      branch = `
        vec2 UV = InUV + sampleOffsets[${sampleIndex / 2}].xy;
        color += SampleFilterTexture(UV) * sampleWeights[${sampleIndex + 0}];
      `;
    }

    ToyGL.draw(gl, {
      vs: NormalizedQuadVert,
      fs: `
        precision highp float;
  
        #define USE_COMBINE_ADDITIVE ${bCombineAdditive ? 1 : 0}
        // #define SampleCount ${sampleCount}
        #define STATIC_SAMPLE_COUNT ${staticSampleCount}
        #define PACKED_STATIC_SAMPLE_COUNT ((STATIC_SAMPLE_COUNT + 1) / 2)
  
        uniform vec4 sampleOffsets[PACKED_STATIC_SAMPLE_COUNT];
        uniform vec4 sampleWeights[STATIC_SAMPLE_COUNT];
        uniform sampler2D filter;
        uniform sampler2D additive;
  
        varying vec2 uv;
  
        vec4 SampleFilterTexture(vec2 uv) {
          return texture2D(filter, uv);
        }
        vec4 SampleAdditiveTexture(vec2 uv) {
          return texture2D(additive, uv);
        }
  
        void main() {
          vec4 color = vec4(0);
          vec2 InUV = uv;
  
          int sampleIndex = 0;
          vec4 UVUV;
          ${unrolledLoop}

          ${branch}

          #if USE_COMBINE_ADDITIVE
            color += SampleAdditiveTexture(InUV);
          #endif
  
          gl_FragColor = color;
        }
      `,
      attributeLocations: {
        a_position: 0,
      },
      uniforms: {
        sampleOffsets: Cartesian4.packArray(shaderParameters.sampleOffsets),
        sampleWeights: Cartesian4.packArray(shaderParameters.sampleWeights),
        filter: shaderParameters.filter,
        additive: shaderParameters.additive,
      },
      vao: gl._ndcQuadVAO,
      count: 6,
      fb: framebuffer,
    });
  }
}


function GetFilterParameters(outParameters, filter, additive, sampleOffsets, sampleWeights) {
  outParameters.filter = filter;
  outParameters.additive = additive;
  outParameters.sampleOffsets = [];
  outParameters.sampleWeights = [];

  for (let sampleIndex = 0; sampleIndex < sampleOffsets.length; sampleIndex += 2) {
    outParameters.sampleOffsets[sampleIndex / 2] = new Cartesian4();

    outParameters.sampleOffsets[sampleIndex / 2].x = sampleOffsets[sampleIndex].x;
    outParameters.sampleOffsets[sampleIndex / 2].y = sampleOffsets[sampleIndex].y;

    // Pack two vec2(x,y) into one vec4(xy, xy)
    if (sampleIndex + 1 < sampleOffsets.length) {
      outParameters.sampleOffsets[sampleIndex / 2].z = sampleOffsets[sampleIndex + 1].x;
      outParameters.sampleOffsets[sampleIndex / 2].w = sampleOffsets[sampleIndex + 1].y;
    }
  }

  for (let sampleIndex = 0; sampleIndex < sampleWeights.length; ++sampleIndex) {
    outParameters.sampleWeights[sampleIndex] = sampleWeights[sampleIndex];
  }

  outParameters.sampleCount = sampleOffsets.length;
}

function GetClampedKernalRadius(sampleCountMax, kernelRadius) {
  return MMath.clamp(kernelRadius, MMath.EPSILON5, sampleCountMax - 1);
}

function GetIntegerKernelRadius(sampleCountMax, kernelRadius) {
  // Smallest radius will be 1.
  return Math.min(Math.ceil(GetClampedKernalRadius(sampleCountMax, kernelRadius)), sampleCountMax - 1);
}

// Evaluates an unnormalized normal distribution PDF around 0 at given X with Variance.
function NormalDistributionUnscaled(X, Sigma, CrossCenterWeight) {
  const DX = Math.abs(X);
  const ClampedOneMinusDX = Math.max(0.0, 1.0 - DX);

  // Tweak the gaussian shape e.g. "r.Bloom.Cross 3.5"
  if (CrossCenterWeight > 1.0) {
    return Math.pow(ClampedOneMinusDX, CrossCenterWeight);
  } else {
    // Constant is tweaked give a similar look to UE4 before we fix the scale bug (Some content tweaking might be needed).
    // The value defines how much of the Gaussian clipped by the sample window.
    // r.Filter.SizeScale allows to tweak that for performance/quality.
    const LegacyCompatibilityConstant = -16.7;

    const Gaussian = Math.exp(LegacyCompatibilityConstant * (DX / Sigma)**2);

    return MMath.lerp(Gaussian, ClampedOneMinusDX, CrossCenterWeight);
  }
}

function Compute1DGaussianFilterKernel(outOffsetAndWeight, sampleCountMax, kernelRadius, crossCenterWeight) {
  const filterSizeScale = 1.0; // [0.1, 10]

  const clampedKernelRadius = GetClampedKernalRadius(sampleCountMax, kernelRadius);
  const integerKernelRadius = GetIntegerKernelRadius(sampleCountMax, kernelRadius * filterSizeScale);

  let sampleCount = 0;
  let weightSum = 0.0;

  for (let sampleIndex = -integerKernelRadius; sampleIndex <= integerKernelRadius; sampleIndex += 2) {
    const weight0 = NormalDistributionUnscaled(sampleIndex, clampedKernelRadius, crossCenterWeight);
    let weight1 = 0.0;

    // We use the bilinear filter optimization for gaussian blur. However, we don't want to bias the
    // last sample off the edge of the filter kernel, so the very last tap just is on the pixel center.
    if (sampleIndex !== integerKernelRadius) {
      weight1 = NormalDistributionUnscaled(sampleIndex + 1, clampedKernelRadius, crossCenterWeight);
    }

    const totalWeight = weight0 + weight1;
    outOffsetAndWeight[sampleCount] = new Cartesian2(
      sampleIndex + (weight1 / totalWeight),
      totalWeight,
    );
    weightSum += totalWeight;
    sampleCount++;
  }

  // Normalize blur weights.
  const weightSumInverse = 1.0 / weightSum;
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    outOffsetAndWeight[sampleIndex].y *= weightSumInverse;
  }

  return sampleCount;
}

function GetBlurRadius(viewSize, kernelSizePercent) {
  const percentToScale = 0.01;
  const diameterToRadius = 0.5;
  return viewSize * kernelSizePercent * percentToScale * diameterToRadius;
}

const FastBlurRadiusThreshold = 100.0; // CVarFastBlurThreshold
function IsFastBlurEnabled(blurRadius) {
  return blurRadius >= FastBlurRadiusThreshold;
}

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
