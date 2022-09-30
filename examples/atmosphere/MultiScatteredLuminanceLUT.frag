// multiple-scattering LUT. Each pixel coordinate corresponds to a height and sun zenith angle, and
// the value is the multiple scattering approximation (Psi_ms from the paper, Eq. 10).
const float mulScattSteps = 20.0;
const int sqrtSamples = 8;

uniform sampler2D uTransmittance;
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

  float invSamples = 1.0/float(sqrtSamples*sqrtSamples);
  for (int i = 0; i < sqrtSamples; i++) {
    for (int j = 0; j < sqrtSamples; j++) {
      // This integral is symmetric about theta = 0 (or theta = PI), so we
      // only need to integrate from zero to PI, not zero to 2*PI.
      // float theta = PI * ((float(i) + 0.5) / float(sqrtSamples)); // [0,PI]
      // float phi = safeAcos( 1.0 - 2.0*(float(j) + 0.5) / float(sqrtSamples) ); // [0,PI]
      // vec3 rayDir = getSphericalDir(theta, phi);
      vec3 rayDir = uUniformSphereSamplesBuffer[i*sqrtSamples+j].xyz;

      float atmoDist = rayIntersectSphere(pos, rayDir, uAtmosphereRadiusMM);
      float groundDist = rayIntersectSphere(pos, rayDir, uGroundRadiusMM);
      float tMax = mix(atmoDist, groundDist, float(groundDist > 0.0));

      float cosTheta = dot(rayDir, lightDir);

      float miePhaseValue = getMiePhase(cosTheta);
      float rayleighPhaseValue = getRayleighPhase(cosTheta);

      vec3 lum = vec3(0.0), lumFactor = vec3(0.0), transmittance = vec3(1.0);
      float t = 0.0;
      for (float stepI = 0.0; stepI < mulScattSteps; stepI += 1.0) {
        float newT = ((stepI + 0.3)/mulScattSteps)*tMax;
        float dt = newT - t;
        t = newT;

        vec3 newPos = pos + t*rayDir;

        vec3 rayleighScattering, mieScattering, extinction;
        getScatteringValues(newPos, rayleighScattering, mieScattering, extinction);

        vec3 sampleTransmittance = exp(-dt*extinction);

        // Integrate within each segment.
        vec3 scatteringNoPhase = rayleighScattering + mieScattering;
        vec3 scatteringF = (scatteringNoPhase - scatteringNoPhase * sampleTransmittance) / extinction;
        lumFactor += transmittance * scatteringF;

        // This is slightly different from the paper, but I think the paper has a mistake?
        // In equation (6), I think S(x,w_s) should be S(x-tv,w_s).
        vec3 sunTransmittance = getValFromTLUT(uTransmittance, newPos, lightDir);

        vec3 rayleighInScattering = rayleighScattering*rayleighPhaseValue;
        vec3 mieInScattering = mieScattering*miePhaseValue;
        vec3 inScattering = (rayleighInScattering + mieInScattering) * sunTransmittance;

        // Integrated scattering within path segment.
        vec3 scatteringIntegral = (inScattering - inScattering * sampleTransmittance) / extinction;

        lum += scatteringIntegral * transmittance;
        transmittance *= sampleTransmittance;
      }

      if (groundDist > 0.0) {
        vec3 hitPos = pos + groundDist*rayDir;
        if (dot(hitPos, lightDir) > 0.0) {
          hitPos = normalize(hitPos) * uGroundRadiusMM;
          lum += transmittance * groundAlbedo * getValFromTLUT(uTransmittance, hitPos, lightDir);
        }
      }

      f_ms += lumFactor * invSamples;
      lumTotal += lum * invSamples;
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