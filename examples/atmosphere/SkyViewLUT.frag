void main() {
  // float u = clamp(gl_FragCoord.x, 0.0, uSkyViewLutSizeAndInvSize.x-1.) / uSkyViewLutSizeAndInvSize.x;
  // float v = clamp(gl_FragCoord.y, 0.0, uSkyViewLutSizeAndInvSize.y-1.) / uSkyViewLutSizeAndInvSize.y;
  float u = gl_FragCoord.x / uSkyViewLutSizeAndInvSize.x;
  float v = gl_FragCoord.y / uSkyViewLutSizeAndInvSize.y;

  float viewHeight = length(uViewPos);
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

  // float tMax = (groundDist < 0.0) ? atmoDist : groundDist;
  // // float tMax = mix(groundDist, atmoDist, float(groundDist < 0.0));
  // tMax = min(9000000.0, tMax);
  vec3 lum = raymarchScattering(
    viewPos,
    rayDir,
    // sunDir,
    light0Dir.xyz,// uAtmosphereLightDirection[0],
    light1Dir.xyz,// uAtmosphereLightDirection[1],
    // SunLight->Proxy->GetColor()
    uAtmosphereLightColor[0].rgb,
    uAtmosphereLightColor[1].rgb
    );
  gl_FragColor = vec4(lum, 1.0);
}