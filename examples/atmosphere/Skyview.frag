uniform sampler2D uTransmittance;
uniform sampler2D uMultiscattering;
uniform vec3 viewPos;
uniform vec3 uSunDir;

const float numScatteringSteps = 32.0;

vec3 raymarchScattering(vec3 pos, 
                        vec3 rayDir, 
                        vec3 sunDir,
                        float tMax) {
  float cosTheta = dot(rayDir, sunDir);

  float miePhaseValue = getMiePhase(cosTheta);
  float rayleighPhaseValue = getRayleighPhase(-cosTheta);

  vec3 lum = vec3(0.0);
  vec3 transmittance = vec3(1.0);
  float t = 0.0;
  for (float i = 0.0; i < numScatteringSteps; i += 1.0) {
    float newT = ((i + 0.3)/numScatteringSteps)*tMax;
    float dt = newT - t;
    t = newT;

    vec3 newPos = pos + t*rayDir;

    vec3 rayleighScattering, extinction;
    float mieScattering;
    getScatteringValues(newPos, rayleighScattering, mieScattering, extinction);

    vec3 sampleTransmittance = exp(-dt*extinction);

    vec3 sunTransmittance = getValFromTLUT(uTransmittance, newPos, sunDir);
    vec3 psiMS = getValFromMultiScattLUT(uMultiscattering, newPos, sunDir);

    vec3 rayleighInScattering = rayleighScattering*(rayleighPhaseValue*sunTransmittance + psiMS);
    vec3 mieInScattering = mieScattering*(miePhaseValue*sunTransmittance + psiMS);
    vec3 inScattering = (rayleighInScattering + mieInScattering);

    // Integrated scattering within path segment.
    vec3 scatteringIntegral = (inScattering - inScattering * sampleTransmittance) / extinction;

    lum += scatteringIntegral*transmittance;

    transmittance *= sampleTransmittance;
  }
  return lum;
}
void main() {
  float u = clamp(gl_FragCoord.x, 0.0, uResolution.x-1.) / uResolution.x;
  float v = clamp(gl_FragCoord.y, 0.0, uResolution.y-1.) / uResolution.y;

  float azimuthAngle = (u - 0.5)*2.0*PI;
  // Non-linear mapping of altitude. See Section 5.3 of the paper.
  float adjV;
  if (v < 0.5) {
    float coord = 1.0 - 2.0*v;
    adjV = -coord*coord;
  } else {
    float coord = v*2.0 - 1.0;
    adjV = coord*coord;
  }

  float height = length(viewPos);
  vec3 up = viewPos / height;
  float horizonAngle = safeAcos(sqrt(height * height - uGroundRadiusMM * uGroundRadiusMM) / height) - 0.5*PI;
  float altitudeAngle = adjV*0.5*PI - horizonAngle;

  float cosAltitude = cos(altitudeAngle);
  vec3 rayDir = vec3(cosAltitude*sin(azimuthAngle), sin(altitudeAngle), -cosAltitude*cos(azimuthAngle));

  float sunAltitude = (0.5*PI) - acos(dot(uSunDir, up));
  vec3 sunDir = vec3(0.0, sin(sunAltitude), -cos(sunAltitude));

  float atmoDist = rayIntersectSphere(viewPos, rayDir, uAtmosphereRadiusMM);
  float groundDist = rayIntersectSphere(viewPos, rayDir, uGroundRadiusMM);
  float tMax = (groundDist < 0.0) ? atmoDist : groundDist;
  vec3 lum = raymarchScattering(viewPos, rayDir, sunDir, tMax);
  gl_FragColor = vec4(lum, 1.0);
}