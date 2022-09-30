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

    MediumSampleRGB medium = SampleMediumRGB(newPos);

    transmittance *= exp(- dt * medium.extinction);
  }

  return transmittance;
}

void main() {
  // float u = clamp(gl_FragCoord.x, 0.0, uTransmittanceLutSizeAndInvSize.x-1.) / uTransmittanceLutSizeAndInvSize.x;
  // float v = clamp(gl_FragCoord.y, 0.0, uTransmittanceLutSizeAndInvSize.y-1.) / uTransmittanceLutSizeAndInvSize.y;
  float u = gl_FragCoord.x / uTransmittanceLutSizeAndInvSize.x;
  float v = gl_FragCoord.y / uTransmittanceLutSizeAndInvSize.y;
  // gl_FragColor = vec4(u, v, 0, 1);return;

  float lightCosTheta = u*2. - 1.;
  float lightTheta = safeAcos(lightCosTheta);
  float viewHeight = mix(uGroundRadiusMM, uAtmosphereRadiusMM, v);

  vec3 eyePos = vec3(0, 0, viewHeight);
  vec3 lightDir = normalize( vec3(0, sin(lightTheta), lightCosTheta) );

  vec4 outColor0;
  outColor0 = vec4(GetTransmittance(eyePos, lightDir), 1);

  gl_FragColor = outColor0;
}
