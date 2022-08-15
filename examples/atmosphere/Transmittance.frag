varying vec2 uv;

const float TransmittanceSteps = 40.0;

vec3 GetTransmittance(vec3 eyePos, vec3 lightDir) {
  if (rayIntersectSphere(eyePos, lightDir, uGroundRadiusMM) > 0.0) {
    return vec3(0);
  }

  float eyeToAtmoDist = rayIntersectSphere(eyePos, lightDir, uAtmosphereRadiusMM);
  float t = 0.0;

  vec3 transmittance = vec3(1.0);
  for (float i = 0.0; i < TransmittanceSteps; i += 1.0) {
    float newT = ((i+0.3) / TransmittanceSteps) * eyeToAtmoDist;
    float dt = newT - t;
    t = newT;

    vec3 newPos = eyePos + t*lightDir;

    vec3 rayleighScattering, extinction;
    float mieScattering;

    getScatteringValues(newPos, rayleighScattering, mieScattering, extinction);

    transmittance *= exp(- dt*extinction);
  }

  return transmittance;
}

void main() {
  float u = clamp(gl_FragCoord.x, 0.0, uResolution.x-1.) / uResolution.x;
  float v = clamp(gl_FragCoord.y, 0.0, uResolution.y-1.) / uResolution.y;
  float lightCosTheta = u*2. - 1.;
  float lightTheta = safeAcos(lightCosTheta);
  float radius = mix(uGroundRadiusMM, uAtmosphereRadiusMM, v);

  vec3 eyePos = vec3(0, radius, 0);
  vec3 lightDir = normalize( vec3(0, lightCosTheta, sin(lightTheta)) );

  vec4 outColor0;
  outColor0 = vec4(GetTransmittance(eyePos, lightDir), 1);

  gl_FragColor = outColor0;
}
