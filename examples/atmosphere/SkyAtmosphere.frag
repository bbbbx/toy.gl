
// varying vec3 viewRay;
varying vec2 uv;
varying vec4 ndc;


uniform sampler2D uStarFieldTexture;
uniform sampler2D uRealStars;
uniform sampler2D uMilkWayTexture;

// unit megameter, so this is 10m
#define PLANET_RADIUS_OFFSET 0.001*1e-3

uniform mat4 uInvViewProjection;
uniform vec4 uViewport;

vec3 getValFromSkyLUT(vec3 rayDir, vec3 sunDir) {
  vec3 viewPos = uViewPos;

  float height = length(viewPos);
  vec3 up = viewPos / height;
  
  float horizonAngle = safeAcos(sqrt(height * height - uGroundRadiusMM * uGroundRadiusMM) / height);
  float altitudeAngle = horizonAngle - acos(dot(rayDir, up)); // Between -PI/2 and PI/2
  float azimuthAngle; // Between 0 and 2*PI
  if (abs(altitudeAngle) > (0.5*PI - .0001)) {
    // Looking nearly straight up or down.
    azimuthAngle = 0.0;
  } else {
    vec3 right = cross(sunDir, up);
    vec3 forward = cross(up, right);

    vec3 projectedDir = normalize(rayDir - up*(dot(rayDir, up)));
    float sinTheta = dot(projectedDir, right);
    float cosTheta = dot(projectedDir, forward);
    azimuthAngle = atan(sinTheta, cosTheta) + PI;
  }

  // Non-linear mapping of altitude angle. See Section 5.3 of the paper.
  float v = 0.5 + 0.5*sign(altitudeAngle)*sqrt(abs(altitudeAngle)*2.0/PI);
  vec2 uv = vec2(azimuthAngle / (2.0*PI), v);

  return texture2D(uSkyViewLutTexture, uv).rgb;
}

vec3 sunWithBloom(vec3 rayDir, vec3 sunDir) {
  const float sunSolidAngle = 0.53*PI/180.0;
  const float minSunCosTheta = cos(sunSolidAngle);

  float cosTheta = dot(rayDir, sunDir);
  if (cosTheta >= minSunCosTheta) return vec3(1.0);
  
  float offset = minSunCosTheta - cosTheta;
  float gaussianBloom = exp(-offset*100000.0)*1.0;
  gaussianBloom += exp(-offset*10000.0)*0.15;
  gaussianBloom += exp(-offset*10.0)*0.01;
  float invBloom = 1.0/(0.02 + offset*300.0)*0.01;
  invBloom += 1.0/(11.22 + offset*300.0)*0.01;
  return vec3(gaussianBloom+invBloom);
}

vec3 jodieReinhardTonemap(vec3 c) {
  // From: https://www.shadertoy.com/view/tdSXzD
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 tc = c / (c + 1.0);
  return mix(c / (l + 1.0), tc, tc);
}


vec3 screenToWorld(vec4 ndc, mat4 invViewProjection) {
  vec4 worldPos = invViewProjection * ndc;
  return worldPos.xyz / worldPos.w;
}
vec3 screenToWorld(vec3 screen, mat4 invViewProjection, vec4 viewport) {
  vec4 ndc = vec4(((screen.xy - viewport.xy) / viewport.zw) * 2. - 1., screen.z * 2. - 1., 1);
  return screenToWorld(ndc, invViewProjection);
}


vec3 GetLightDiskLuminance(vec3 worldPos, vec3 worldDir, float uGroundRadiusMM, float uAtmosphereRadiusMM,
  sampler2D uTransmittance,
  vec3 lightDir, float lightDiscCosHalfApexAngle, vec3 lightDiskLuminance
) {
  float ViewDotLight = dot(worldDir, lightDir);
  if (ViewDotLight > lightDiscCosHalfApexAngle) {
    // vec3 transmittanceToLight = GetAtmosphereTransmittance()
    float worldPosHeight = length(worldPos);
    vec3 upVector = worldPos / worldPosHeight;
    float cosZenith = dot(upVector, lightDir);
    vec3 transmittanceToLight = getTransmittance(cosZenith, worldPosHeight);
    return transmittanceToLight * lightDiskLuminance;
  }

  return vec3(0);
}

/**
 * worldPos: megameter unit
 */
vec3 GetLightDiskLuminance(vec3 worldPos, vec3 worldDir, vec3 lightDir, float lightDiscCosHalfApexAngle, vec3 lightDiskLuminance) {
  float t = rayIntersectSphere(worldPos, worldDir, uGroundRadiusMM);
  if (t < 0.0) {
    vec3 LightDiskLuminance = GetLightDiskLuminance(
      worldPos, worldDir, uGroundRadiusMM, uAtmosphereRadiusMM,
      uTransmittanceLutTexture,
      lightDir, lightDiscCosHalfApexAngle, lightDiskLuminance
    );

    float ViewPreExposure = 1.;
    vec3 ExposedLightLuminance = LightDiskLuminance * ViewPreExposure;

    float ViewDotLight = dot(worldDir, lightDir);
    float CosHalfApex = lightDiscCosHalfApexAngle;
    float HalfCosHalfApex = CosHalfApex + (1.0 - CosHalfApex) * 0.25; // Start fading when at 75% distance from light disk center (in cosine space)

    float Weight = 1.0 - clamp((HalfCosHalfApex-ViewDotLight) / (HalfCosHalfApex-CosHalfApex), 0.0, 1.0);
    ExposedLightLuminance *= Weight;

    return ExposedLightLuminance;
  }

  return vec3(0);
}

uniform vec3 uTopLeft;
uniform vec3 uTopRight;
uniform vec3 uBottomLeft;
uniform vec3 uBottomRight;
uniform sampler2D uDepthTexture;
uniform sampler2D uSceneColorTexture;

void main() {
  if (texture2D(uDepthTexture, uv).r != 1.0) {
    // 
    vec3 sceneColor = texture2D(uSceneColorTexture, uv).rgb;
    float L0oN = clamp(dot(uAtmosphereLightDirection[0], sceneColor), 0.0, 1.0);
    float L1oN = clamp(dot(uAtmosphereLightDirection[1], sceneColor), 0.0, 1.0);
    // gl_FragColor.rgb = vec3(L0oN*0.1 + L1oN*0.01);
    gl_FragColor.rgb = sceneColor * 0.03;
    gl_FragColor.a = 1.0;
    return;

    discard;
  }

  // vec3 worldPos = screenToWorld(gl_FragCoord.xyz, uInvViewProjection, uViewport);
  // vec3 worldPos = screenToWorld(ndc, uInvViewProjection) * 1e-6;
  // vec3 rayDir = normalize(viewRay);
  vec3 viewPos = uViewPos;
  float viewHeight = length(viewPos);
  // vec3 rayDir = normalize(worldPos - viewPos);

  vec3 bottom = mix(uBottomLeft, uBottomRight, vec3(uv.x));
  vec3 top = mix(uTopLeft, uTopRight, vec3(uv.x));
  vec3 rayDir = mix(bottom, top, vec3(uv.y));
  rayDir = normalize(rayDir);
  // gl_FragColor = vec4(rayDir, 1);return;
  // gl_FragColor = vec4(uv, 0, 1);return;
  // gl_FragColor = vec4(0.4, 0.5, 0.6, 1);return;


  vec2 skyViewLutUv;
  vec3 rayDirLocal = uSkyViewLutReferential * rayDir;
  SkyViewLutParamsToUv(rayDirLocal, viewHeight, skyViewLutUv);
  // gl_FragColor = vec4(rayDirLocal, 1);return;
  // gl_FragColor = vec4(gl_FragCoord.xy/uViewport.zw, 0, 1);return;

// 因为是以 sunDir 确定 x 轴，所以要传 uAtmosphereLightDirection[0]
  vec3 lum = vec3(0);
  vec3 startPos;
  // vec3 lum = getValFromSkyLUT(rayDirLocal, uAtmosphereLightDirection[0]);
  if (viewHeight < uAtmosphereRadiusMM) {
    lum += texture2D(uSkyViewLutTexture, skyViewLutUv).rgb;
  } else {
    float atmoDistance = rayIntersectSphere(viewPos, rayDir, uAtmosphereRadiusMM);
    if (atmoDistance >= 0.0) {
      vec3 upVector = viewPos / viewHeight;
      // vec3 upOffset = upVector * -PLANET_RADIUS_OFFSET;
      float offset = max(PLANET_RADIUS_OFFSET, (viewHeight-uAtmosphereRadiusMM)*(0.1/20.0*1e-3));
      vec3 upOffset = upVector * -offset;
      startPos = viewPos + rayDir * atmoDistance + upOffset;

      // startPos += rayDir * 0.1*1e-3; // 0.1km

      // float groundDistance = rayIntersectSphere(startPos, rayDir, uGroundRadiusMM);
      // atmoDistance = rayIntersectSphere(startPos, rayDir, uGroundRadiusMM);
      // float tMax = groundDistance > 0.0 ? groundDistance : atmoDistance;
      lum += raymarchScattering(
        startPos,
        rayDir,
        uAtmosphereLightDirection[0].xyz,
        uAtmosphereLightDirection[1].xyz,
        uAtmosphereLightColor[0].xyz,
        uAtmosphereLightColor[1].xyz);

      // if (all(equal(lum, vec3(0)))) {
      //   lum += vec3(0,1,0);
      // }
      // gl_FragColor = vec4(lum,1);
      // return;
    }
  }


  // uAtmosphereLightDirection to worldDir
  lum += GetLightDiskLuminance(viewPos, rayDir, uAtmosphereLightDirection[0],
    uAtmosphereLightDiscCosHalfApexAngle[0], uAtmosphereLightDiscLuminance[0]);
#if SECOND_ATMOSPHERE_LIGHT_ENABLED
  lum += GetLightDiskLuminance(viewPos, rayDir, uAtmosphereLightDirection[1],
    uAtmosphereLightDiscCosHalfApexAngle[1], uAtmosphereLightDiscLuminance[1]);
#endif

  // Add Stars Luminance
  if (rayIntersectSphere(viewPos, rayDir, uGroundRadiusMM) <= 0.0) {
    lum += vec3(texture2D(uStarFieldTexture, uv)).r;

    float longitude = atan(rayDir.y, rayDir.x);
    float latitude = asin(rayDir.z);
    vec2 uv = vec2(longitude/PI*0.5+0.5, latitude/(PI/2.0)*0.5+0.5);
    lum += texture2D(uMilkWayTexture, uv).rgb * 0.005;
    // lum = vec3(rayDir);
    // lum = vec3(uv, 0);
  }
  // lum = normalize(worldPos);
  // lum = rayDir;
  // lum = rayDirLocal;

  // TODO: view 位于大气外则直接 ray marching

  // lum += vec3(texture2D(uStarFieldTexture, vec2(uv.x, 1.-uv.y)).r);
  // lum = vec3(uv, 0);

  // lum = vec3(0);
  // vec3 light0DiscLum = sunWithBloom(rayDir, uAtmosphereLightDirection[0]);
  // light0DiscLum = smoothstep(0.002, 1.0, light0DiscLum);
  // if (length(light0DiscLum) > 0.0) {
  //   if (rayIntersectSphere(uEyePos, rayDir, uGroundRadiusMM) >= 0.0) {
  //     light0DiscLum *= 0.0;
  //   } else {
  //     light0DiscLum *= getValFromTLUT(uTransmittance, uEyePos, uAtmosphereLightDirection[0]);
  //     // light0DiscLum = vec3(1, 0, 0);
  //   }
  // }
  // lum += light0DiscLum;

  // vec3 light1DiscLum = sunWithBloom(rayDir, uAtmosphereLightDirection[1]);
  // light1DiscLum = smoothstep(0.002, 1.0, light1DiscLum);
  // if (length(light1DiscLum) > 0.0) {
  //   if (rayIntersectSphere(uEyePos, rayDir, uGroundRadiusMM) >= 0.0) {
  //     light1DiscLum *= 0.0;
  //   } else {
  //     light1DiscLum *= getValFromTLUT(uTransmittance, uEyePos, uAtmosphereLightDirection[1]);
  //     light1DiscLum = vec3(0, 1, 0);
  //     light1DiscLum = vec3(0);
  //   }
  // }
  // lum += light1DiscLum;

  // lum *= pow(2., -3.91);
  // lum *= pow(2., -2.43);
  // lum *= pow(2., -0.43);
  // lum *= mix(1., 10., dot(rayDir, uAtmosphereLightDirection[0]));

  // lum = pow(lum, vec3(1.3));
  // lum /= (smoothstep(0.0, 0.2, clamp(uAtmosphereLightDirection[0].y, 0.0, 1.0))*2.0 + 0.15);

  vec3 outColor;
  // lum *= 10.0;
  // outColor = jodieReinhardTonemap(lum);
  // outColor = ColorLookupTable(lum);
  // outColor = pow(outColor, vec3(1.0/2.2));

  // gl_FragColor = vec4(outColor, 1);
  gl_FragColor = vec4(lum, 1);
}
