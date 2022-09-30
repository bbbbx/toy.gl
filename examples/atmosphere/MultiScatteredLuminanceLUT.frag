const float MultiScatterSteps = 20.0;
const int SqrtSampleCount = 8;
const float InvSampleCount = 1.0 / float(SqrtSampleCount * SqrtSampleCount);

uniform vec4 uUniformSphereSamplesBuffer[64];

// Y-up, start at z axis
// x
// | /
// |/theta
// x----- z
vec3 getSphericalDir(float theta, float phi) {
  float cosPhi = cos(phi);
  float sinPhi = sin(phi);
  float x = sinPhi * sin(theta);
  float z = sinPhi * cos(theta);
  return vec3(x, cosPhi, z);
}

// Calculates Equation (5) and (7) from the paper.
void getMulScattValues(vec3 pos, vec3 lightDir, out vec3 lumTotal, out vec3 f_ms) {
  lumTotal = vec3(0.0);
  f_ms = vec3(0.0);

  for (int i = 0; i < SqrtSampleCount; i++) {
    for (int j = 0; j < SqrtSampleCount; j++) {
      // This integral is symmetric about theta = 0 (or theta = PI), so we
      // only need to integrate from zero to PI, not zero to 2*PI.
      // float theta = PI * ((float(i) + 0.5) / float(SqrtSampleCount)); // [0,PI]
      // float phi = safeAcos( 1.0 - 2.0*(float(j) + 0.5) / float(SqrtSampleCount) ); // [0,PI]
      // vec3 rayDir = getSphericalDir(theta, phi);
      vec3 rayDir = uUniformSphereSamplesBuffer[i*SqrtSampleCount + j].xyz;

      float atmoDist = rayIntersectSphere(pos, rayDir, uAtmosphereRadiusMM);
      float groundDist = rayIntersectSphere(pos, rayDir, uGroundRadiusMM);
      float tMax = mix(atmoDist, groundDist, float(groundDist > 0.0));

      float cosTheta = dot(rayDir, lightDir);

      float miePhaseValue = getMiePhase(cosTheta);
      float rayleighPhaseValue = getRayleighPhase(cosTheta);

      vec3 lum = vec3(0.0), lumFactor = vec3(0.0), transmittance = vec3(1.0);
      float t = 0.0;
      for (float stepI = 0.0; stepI < MultiScatterSteps; stepI += 1.0) {
        float newT = ((stepI + 0.3) / MultiScatterSteps)*tMax;
        float dt = newT - t;
        t = newT;

        vec3 newPos = pos + t*rayDir;

        MediumSampleRGB medium = SampleMediumRGB(newPos);

        vec3 sampleTransmittance = exp(- dt * medium.extinction);

        // Integrate within each segment.
        vec3 scatteringNoPhase = medium.scattering;
        vec3 scatteringF = (scatteringNoPhase - scatteringNoPhase * sampleTransmittance) / medium.extinction;
        lumFactor += transmittance * scatteringF;

        // This is slightly different from the paper, but I think the paper has a mistake?
        // In equation (6), I think S(x,w_s) should be S(x-tv,w_s).
        float newPosHeight = length(newPos);
        vec3 upVector = newPos / newPosHeight;
        float lightZenithCosAngle = dot(lightDir, upVector);
        vec3 sunTransmittance = getTransmittance(lightZenithCosAngle, newPosHeight);

        vec3 rayleighInScattering = medium.scatteringRayleigh * rayleighPhaseValue;
        vec3 mieInScattering = medium.scatteringMie * miePhaseValue;
        vec3 inScattering = (rayleighInScattering + mieInScattering) * sunTransmittance;

        // Integrated scattering within path segment.
        vec3 scatteringIntegral = (inScattering - inScattering * sampleTransmittance) / medium.extinction;

        lum += scatteringIntegral * transmittance;
        transmittance *= sampleTransmittance;
      }

      if (groundDist > 0.0) {
        vec3 hitPos = pos + groundDist*rayDir;
        if (dot(hitPos, lightDir) > 0.0) {
          hitPos = normalize(hitPos) * uGroundRadiusMM;
          float hitPosHeight = length(hitPos);
          vec3 upVector = hitPos / hitPosHeight;
          float lightZenithCosAngle = dot(lightDir, upVector);
          vec3 transmittanceFromHitPosToLight = getTransmittance(lightZenithCosAngle, hitPosHeight);

          lum += transmittance * groundAlbedo * transmittanceFromHitPosToLight;
        }
      }

      f_ms += lumFactor * InvSampleCount;
      lumTotal += lum * InvSampleCount;
    }
  }
}

void main() {
  // float u = clamp(gl_FragCoord.x, 0.0, uMultiScatteredLuminanceLutSizeAndInvSize.x-1.) / uMultiScatteredLuminanceLutSizeAndInvSize.x;
  // float v = clamp(gl_FragCoord.y, 0.0, uMultiScatteredLuminanceLutSizeAndInvSize.y-1.) / uMultiScatteredLuminanceLutSizeAndInvSize.y;
  float u = gl_FragCoord.x / uMultiScatteredLuminanceLutSizeAndInvSize.x;
  float v = gl_FragCoord.y / uMultiScatteredLuminanceLutSizeAndInvSize.y;

  float cosLightZenith = u*2.0 - 1.0;
  float sinLightZenith = sqrt(1.0 - cosLightZenith*cosLightZenith);
  vec3 lightDir = vec3(0, sinLightZenith, cosLightZenith);
  float viewHeight = uGroundRadiusMM + (v * (uAtmosphereRadiusMM - uGroundRadiusMM));
  // float lightTheta = safeAcos(lightCosTheta);
  // float radius = mix(uGroundRadiusMM, uAtmosphereRadiusMM, v);

  // vec3 eyePos = vec3(0, radius, 0);
  // vec3 lightDir = normalize( vec3(0, lightCosTheta, sin(lightTheta)) );
  // Z up
  vec3 eyePos = vec3(0, 0, viewHeight);
  // vec3 lightDir = normalize( vec3(0, sin(lightTheta), lightCosTheta) );

  vec3 lum, f_ms;
  getMulScattValues(eyePos, lightDir, lum, f_ms);

  // Equation 10 from the paper.
  vec3 psi = lum / (1.0 - f_ms);
  gl_FragColor = vec4(psi, 1);
}