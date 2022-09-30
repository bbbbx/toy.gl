#define SAMPLE_COUNT 10
uniform vec4 uUniformSphereSamplesBuffer[64];
uniform float uDistantSkyLightSampleAltitude;

void main() {

  vec3 samplePos = vec3(0, 0, uGroundRadiusMM + uDistantSkyLightSampleAltitude);
  float viewHeight = length(samplePos);

  vec3 accumulatedLuminanceSamples = vec3(0);
  vec3 light0Dir = uAtmosphereLightDirection[0].xyz;
  vec3 light1Dir = uAtmosphereLightDirection[1].xyz;

  for (int i = 0; i < 64; i++) {
    vec3 sampleDir = uUniformSphereSamplesBuffer[i].xyz;

#if 1
    accumulatedLuminanceSamples += raymarchScattering(samplePos, sampleDir,
      light0Dir, light1Dir,
      uAtmosphereLightColor[0].xyz, uAtmosphereLightColor[1].xyz);

#else

  //   vec3 L = vec3(0);
  //   {
  //     float groundDistance = rayIntersectSphere(samplePos, sampleDir, uGroundRadiusMM);
  //     float atmoDistance = rayIntersectSphere(samplePos, sampleDir, uAtmosphereRadiusMM);
  //     float tMax = groundDistance > 0.0 ? groundDistance : atmoDistance;
  //     // Intersecting with nothing
  //     if (tMax <= 0.0) {
  //       continue;
  //     }
  //     float dt = tMax / float(SAMPLE_COUNT);

  //     float uniformPhase = 1.0 / (4.0 * PI);
  //     vec3 wi = light0Dir;
  //     vec3 wo = sampleDir;
  //     float cosTheta = dot(wi, wo);
  //     float miePhaseValue0 = getMiePhase(-cosTheta);
  //     float rayleighPhaseValue0 = getRayleighPhase(cosTheta);
  // #ifdef SECOND_ATMOSPHERE_LIGHT_ENABLED
  //     wi = light1Dir;
  //     cosTheta = dot(wi, wo);
  //     float miePhaseValue1 = getMiePhase(-cosTheta);
  //     float rayleighPhaseValue1 = getRayleighPhase(cosTheta);
  // #endif

  //     vec3 throughput = vec3(1);

  //     vec3 exposedLight0Illuminance = uAtmosphereLightColor[0].xyz;
  // #ifdef SECOND_ATMOSPHERE_LIGHT_ENABLED
  //     vec3 exposedLight1Illuminance = uAtmosphereLightColor[1].xyz;
  // #endif

  //     float pixelNoise = 0.3;
  //     for (int j = 0; j < SAMPLE_COUNT; j++) {
  //       float t = tMax * (float(j) + pixelNoise) / float(SAMPLE_COUNT);
  //       vec3 P = samplePos + t * sampleDir;
  //       float PHeight = length(P);

  //       vec3 rayleighScattering, mieScattering, extinction;
  //       getScatteringValues(P, rayleighScattering, mieScattering, extinction);
  //       vec3 sampleTransmittance = exp(- dt * extinction);
  //       vec3 scattering = rayleighScattering + mieScattering;

  //       vec3 upVector = P / PHeight;
  //       float light0ZenithCosAngle = dot(light0Dir, upVector);
  //       vec3 transmittanceToLight0 = getTransmittance(light0ZenithCosAngle, PHeight);
  //       // vec3 phaseTimesScattering0 = scattering * uniformPhase;
  //       vec3 phaseTimesScattering0 = rayleighScattering * rayleighPhaseValue0 + mieScattering * miePhaseValue0;
  // #ifdef SECOND_ATMOSPHERE_LIGHT_ENABLED
  //       // Phase and transmittance for light 1
  //       float light1ZenithCosAngle = dot(light1Dir, upVector);
  //       vec3 transmittanceToLight1 = getTransmittance(light1ZenithCosAngle, PHeight);
  //       vec3 phaseTimesScattering1 = rayleighScattering * rayleighPhaseValue1 + mieScattering * miePhaseValue1;
  // #endif

  //       vec3 multiScatteredLuminance0 = getMultipleScattering(P, light0ZenithCosAngle);

  //       float planetShadow0 = rayIntersectSphere(P, light0Dir, uGroundRadiusMM) > 0.0 ? 0.0 : 1.0;
  //       vec3 S = exposedLight0Illuminance * (planetShadow0 * transmittanceToLight0 * phaseTimesScattering0 + multiScatteredLuminance0*scattering);
  // #ifdef SECOND_ATMOSPHERE_LIGHT_ENABLED
  //       float planetShadow1 = rayIntersectSphere(P, light1Dir, uGroundRadiusMM) > 0.0 ? 0.0 : 1.0;
  //       //  Multi-scattering can work for the second light but it is disabled for the sake of performance.
  //       S += exposedLight1Illuminance * (planetShadow1 * transmittanceToLight1 * phaseTimesScattering1);
  // #endif

  //       vec3 sint = (S - S * sampleTransmittance) / extinction;
  //       L += throughput * sint;
  //       throughput *= sampleTransmittance;
  //     }
  //   }

  //   accumulatedLuminanceSamples += L;

#endif

  }

  float sampleSolidAngle = (4.0*PI) / 64.0;
  vec3 illuminance = accumulatedLuminanceSamples * sampleSolidAngle;
  float uniformPhaseFunction = 1.0 / (4.0*PI);

  gl_FragColor = vec4(illuminance * uniformPhaseFunction, 1);
}