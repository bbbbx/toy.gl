
function SkyAtmosphereShaderDefinition() {
  this.definitions = {
    WHITE_TRANSMITTANCE: undefined,
    TRANSMITTANCE_PASS: undefined,
    MULTISCATT_PASS: undefined,
    SKYLIGHT_PASS: undefined,
    MULTISCATTERING_APPROX_ENABLED: undefined,

    // r.SkyAtmosphere.MultiScatteringLUT.HighQuality
    // The when enabled, 64 samples are used instead of 2, resulting in a more accurate multi scattering approximation (but also more expenssive).
    HIGHQUALITY_MULTISCATTERING_APPROX_ENABLED: undefined,

    FASTSKY_ENABLED: undefined,
    FASTAERIALPERSPECTIVE_ENABLED: undefined,
    SOURCE_DISK_ENABLED: undefined,

    SECOND_ATMOSPHERE_LIGHT_ENABLED: undefined,
    RENDERSKY_ENABLED: undefined,
    PER_PIXEL_NOISE: undefined,

    INTEGRATE_SAMPLE_COUNT: undefined,

    UniformSphereSamplesBufferSampleCount: undefined,
  };
}

SkyAtmosphereShaderDefinition.new = function() {
  return new SkyAtmosphereShaderDefinition();
};

SkyAtmosphereShaderDefinition.prototype.set = function(property, value) {
  this.definitions[property] = value;
  return this;
};

SkyAtmosphereShaderDefinition.prototype.build = function() {
  let defines = '';
  for (const name in this.definitions) {
    if (Object.hasOwnProperty.call(this.definitions, name)) {
      const definition = this.definitions[name];
      if (typeof definition !== 'undefined') {
        defines += `#define ${name} ${definition}\n`;
      }
    }
  }

  return defines;
};

SkyAtmosphereShaderDefinition.TransmittancePassShaderDefinition = SkyAtmosphereShaderDefinition.new()
  .set('WHITE_TRANSMITTANCE', 1)
  .set('TRANSMITTANCE_PASS', 1)
  .set('INTEGRATE_SAMPLE_COUNT', 10)
  .build();

SkyAtmosphereShaderDefinition.MultiScattPassShaderDefinition = SkyAtmosphereShaderDefinition.new()
  .set('MULTISCATT_PASS', 1)
  .set('HIGHQUALITY_MULTISCATTERING_APPROX_ENABLED', 0)
  .set('INTEGRATE_SAMPLE_COUNT', 15)

  .set('UniformSphereSamplesBufferSampleCount', 8)
  .build();

SkyAtmosphereShaderDefinition.SkyViewPassShaderDefinition = SkyAtmosphereShaderDefinition.new()
  .set('MULTISCATTERING_APPROX_ENABLED', 1)
  .set('HIGHQUALITY_MULTISCATTERING_APPROX_ENABLED', 0)
  .set('SECOND_ATMOSPHERE_LIGHT_ENABLED', 1)

  .set('INTEGRATE_SAMPLE_COUNT', 32)
  .build();

SkyAtmosphereShaderDefinition.RenderSkyAtmospherePassShaderDefinition = SkyAtmosphereShaderDefinition.new()
  .set('MULTISCATTERING_APPROX_ENABLED', 0)
  .set('FASTSKY_ENABLED', 1)
  .set('FASTAERIALPERSPECTIVE_ENABLED', 0)
  .set('SOURCE_DISK_ENABLED', 1)
  .set('SECOND_ATMOSPHERE_LIGHT_ENABLED', 1)
  .set('RENDERSKY_ENABLED', 1)
  .set('PER_PIXEL_NOISE', 1)

  .set('INTEGRATE_SAMPLE_COUNT', 16)
  .build();

export default SkyAtmosphereShaderDefinition;
