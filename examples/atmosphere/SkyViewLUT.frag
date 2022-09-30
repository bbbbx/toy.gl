uniform sampler2D uTransmittance;
uniform sampler2D uMultiscattering;
// uniform vec3 viewPos;
uniform vec3 uEyePos;
// uniform vec3 uSunDir;


const float NumScatteringSteps = 32.0;

vec3 getTransmittance(float cosZenith, float heightMM) {
  vec2 uv = vec2(
    clamp(cosZenith * 0.5 + 0.5, 0.0, 1.0),
    (heightMM - uGroundRadiusMM) / (uAtmosphereRadiusMM-uGroundRadiusMM)
  );
  return texture2D(uTransmittance, uv).rgb;
}

vec3 getMultipleScattering(vec3 pos, float cosZenith) {
  vec2 uv = vec2(
    clamp(cosZenith * 0.5 + 0.5, 0., 1.),
    clamp((length(pos) - uGroundRadiusMM) / (uAtmosphereRadiusMM-uGroundRadiusMM), 0., 1.)
  );
  return texture2D(uMultiscattering, uv).rgb;
}


vec3 raymarchScattering(vec3 pos,
                        vec3 rayDir,
                        vec3 light0Dir,
                        vec3 light1Dir,
                        vec3 light0Illuminance,
                        vec3 light1Illuminance,
                        float tMax) {

  float cosTheta = dot(rayDir, light0Dir);
  // negate cosTheta because due to rayDir being a "in" direction. 
  float miePhaseValue0 = getMiePhase(-cosTheta);
  float rayleighPhaseValue0 = getRayleighPhase(cosTheta);
#if SECOND_ATMOSPHERE_LIGHT_ENABLED
  cosTheta = dot(rayDir, light1Dir);
  float miePhaseValue1 = getMiePhase(-cosTheta);
  float rayleighPhaseValue1 = getRayleighPhase(cosTheta);
#endif

  vec3 exposedLight0Illuminance = light0Illuminance * 1.0;// ViewPreExposure;
#if SECOND_ATMOSPHERE_LIGHT_ENABLED
  vec3 exposedLight1Illuminance = light1Illuminance * 1.0;// ViewPreExposure;
#endif

  // L
  vec3 L = vec3(0.0);
  // Throughput
  vec3 transmittance = vec3(1.0);
  float t = 0.0;
  for (float i = 0.0; i < NumScatteringSteps; i += 1.0) {
    float newT = ((i + 0.3)/NumScatteringSteps)*tMax;
    float dt = newT - t;
    t = newT;

    vec3 newPos = pos + t * rayDir;
    float pHeight = length(newPos);
    vec3 upVector = newPos / pHeight;

    vec3 rayleighScattering, mieScattering, extinction;
    // SampleMediumRGB
    getScatteringValues(newPos, rayleighScattering, mieScattering, extinction);
    vec3 scattering = rayleighScattering + mieScattering;
    vec3 sampleTransmittance = exp(-dt * extinction /* * AerialPespectiveViewDistanceScale */);

    // vec3 lightDir = uAtmosphereLightDirection[0];
    // Phase and transmittance for light 0
    float light0ZenithCosAngle = dot(light0Dir, upVector);
    vec3 transmittanceToLight0 = getTransmittance(light0ZenithCosAngle, pHeight);
    vec3 phaseTimesScattering0 = mieScattering * miePhaseValue0 + rayleighScattering * rayleighPhaseValue0;

#if SECOND_ATMOSPHERE_LIGHT_ENABLED
    // Phase and transmittance for light 1
    float light1ZenithCosAngle = dot(light1Dir, upVector);
    vec3 transmittanceToLight1 = getTransmittance(light1ZenithCosAngle, pHeight);
    vec3 phaseTimesScattering1 = mieScattering * miePhaseValue1 + rayleighScattering * rayleighPhaseValue1;
#endif

    // Multiple scattering approximation
    vec3 multiScatteredLuminance0 = getMultipleScattering(newPos, light0ZenithCosAngle);

    float tPlanet0 = rayIntersectSphere(newPos, light0Dir, uGroundRadiusMM);
    float planetShadow0 = mix(1.0, 0.0, float(tPlanet0 >= 0.));
    // MultiScatteredLuminance is already pre-exposed, atmospheric light contribution needs to be pre exposed
    vec3 S = exposedLight0Illuminance *
      (planetShadow0 * transmittanceToLight0 * phaseTimesScattering0 + multiScatteredLuminance0 * scattering);

#if SECOND_ATMOSPHERE_LIGHT_ENABLED
    float tPlanet1 = rayIntersectSphere(newPos, light1Dir, uGroundRadiusMM);
    float planetShadow1 = mix(1.0, 0.0, float(tPlanet1 >= 0.));
    //  Multi-scattering can work for the second light but it is disabled for the sake of performance.
    S += (planetShadow1 * transmittanceToLight1 * phaseTimesScattering1) * exposedLight1Illuminance;
#endif

#if 0
    L += transmittance * S * dt;
#else
    // See slide 28 at http://www.frostbite.com/2015/08/physically-based-unified-volumetric-rendering-in-frostbite/ 
    vec3 Sint = (S - S * sampleTransmittance) / extinction;
    L += transmittance * Sint;
#endif
    transmittance *= sampleTransmittance;


//     vec3 S = getValFromTLUT(uTransmittance, newPos, sunDir);
//     vec3 psiMS = getValFromMultiScattLUT(uMultiscattering, newPos, sunDir);

// // TODO: 添加第二个光源
//     vec3 E0 = uAtmosphereLightDiscLuminance[0];
//     float phaseValue = miePhaseValue + rayleighPhaseValue;
//     vec3 Lscat = rayleighScattering * (transmittance * S * phaseValue + psiMS) * E0;
//     // vec3 rayleighInScattering = rayleighScattering * (rayleighPhaseValue*sunTransmittance + psiMS);
//     // vec3 mieInScattering = mieScattering * (miePhaseValue*sunTransmittance + psiMS);
//     // vec3 inScattering = (rayleighInScattering + mieInScattering);
// #if SECOND_ATMOSPHERE_LIGHT_ENABLED
//     vec3 E1 = uAtmosphereLightDiscLuminance[1];
//     // inScattering +=
// #endif

//     // Integrated scattering within path segment.
//     vec3 scatteringIntegral = (inScattering - inScattering * sampleTransmittance) / extinction;
//     lum += scatteringIntegral * transmittance;

//     transmittance *= sampleTransmittance;
  }
  return L;
}

void main() {
  // float u = clamp(gl_FragCoord.x, 0.0, uSkyViewLutSizeAndInvSize.x-1.) / uSkyViewLutSizeAndInvSize.x;
  // float v = clamp(gl_FragCoord.y, 0.0, uSkyViewLutSizeAndInvSize.y-1.) / uSkyViewLutSizeAndInvSize.y;
  float u = gl_FragCoord.x / uSkyViewLutSizeAndInvSize.x;
  float v = gl_FragCoord.y / uSkyViewLutSizeAndInvSize.y;

  float viewHeight = length(uEyePos);
  // if (viewHeight > uAtmosphereRadiusMM) {
  //   gl_FragColor = vec4(0);
  //   return;
  // }

  // float azimuthAngle = (u - 0.5)*2.0*PI;
  // Non-linear mapping of altitude. See Section 5.3 of the paper.
  // float adjV;
  // if (v < 0.5) {
  //   float coord = 1.0 - 2.0*v;
  //   adjV = -coord*coord;
  // } else {
  //   float coord = v*2.0 - 1.0;
  //   adjV = coord*coord;
  // }

  vec3 viewPos = vec3(0, 0, viewHeight);
  // vec3 up = viewPos / viewHeight;
  // float horizonAngle = safeAcos(sqrt(viewHeight*viewHeight - uGroundRadiusMM*uGroundRadiusMM) / viewHeight) - 0.5*PI;
  // float altitudeAngle = adjV*0.5*PI - horizonAngle;

  // float cosAltitude = cos(altitudeAngle);
  // vec3 rayDir = vec3(cosAltitude*sin(azimuthAngle), sin(altitudeAngle), -cosAltitude*cos(azimuthAngle));

  vec3 rayDir;
  UvToSkyViewLutParams(rayDir, viewHeight, vec2(u, v));
  // gl_FragColor = vec4(rayDir, 1);
  // gl_FragColor = vec4(u, v, 0, 1);
  // return;

  // float light0Altitude = (0.5*PI) - acos(dot(uAtmosphereLightDirection[0], up));
  // vec3 light0Dir = vec3(0.0, -cos(light0Altitude), sin(light0Altitude));
  vec3 light0Dir = uSkyViewLutReferential * uAtmosphereLightDirection[0];
  // vec3 light0Dir = uAtmosphereLightDirection[0];
  // float light1Altitude = (0.5*PI) - acos(dot(uAtmosphereLightDirection[1], up));
  // vec3 light1Dir = vec3(0.0, -cos(light1Altitude), sin(light1Altitude));
  vec3 light1Dir = uSkyViewLutReferential * uAtmosphereLightDirection[1];
  // vec3 light1Dir = uAtmosphereLightDirection[1];

  // gl_FragColor = vec4(light1Dir, 1);
  // return;

  // float light1Altitude = (0.5*PI) - acos(dot(uAtmosphereLightDirection[1], up));
  // float sunAltitude = (0.5*PI) - acos(dot(uAtmosphereLightDirection[0], up));
  // vec3 sunDir = vec3(0.0, sin(sunAltitude), -cos(sunAltitude));

  float atmoDist = rayIntersectSphere(viewPos, rayDir, uAtmosphereRadiusMM);
  float groundDist = rayIntersectSphere(viewPos, rayDir, uGroundRadiusMM);

  if (atmoDist < 0.0 && groundDist < 0.0) {
    gl_FragColor = vec4(0);
    return;
  }

  float tMax = (groundDist < 0.0) ? atmoDist : groundDist;
  // float tMax = mix(groundDist, atmoDist, float(groundDist < 0.0));
  tMax = min(9000000.0, tMax);
  vec3 lum = raymarchScattering(
    viewPos,
    rayDir,
    // sunDir,
    light0Dir.xyz,// uAtmosphereLightDirection[0],
    light1Dir.xyz,// uAtmosphereLightDirection[1],
    // SunLight->Proxy->GetColor()
    uAtmosphereLightColor[0].rgb,
    uAtmosphereLightColor[1].rgb,
    tMax
    );
  gl_FragColor = vec4(lum, 1.0);
}