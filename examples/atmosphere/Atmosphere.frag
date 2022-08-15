/*
 * Partial implementation of
 *    "A Scalable and Production Ready Sky and Atmosphere Rendering Technique"
 *    by Sébastien Hillaire (2020).
 * Very much referenced and copied Sébastien's provided code: 
 *    https://github.com/sebh/UnrealEngineSkyAtmosphere
 * and AndrewHelmer's shadertoy implementation:
 *    https://www.shadertoy.com/view/slSXRW
 */

varying vec3 viewRay;

uniform sampler2D uTransmittance;
uniform sampler2D uMultiscattering;
uniform sampler2D uSkyView;

uniform vec3 uEyePos;
uniform vec3 uSunDir;

vec3 getValFromSkyLUT(vec3 rayDir, vec3 sunDir) {
  vec3 viewPos = uEyePos;

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

  return texture2D(uSkyView, uv).rgb;
}

vec3 sunWithBloom(vec3 rayDir, vec3 sunDir) {
  const float sunSolidAngle = 0.53*PI/180.0;
  const float minSunCosTheta = cos(sunSolidAngle);

  float cosTheta = dot(rayDir, sunDir);
  if (cosTheta >= minSunCosTheta) return vec3(1.0);
  
  float offset = minSunCosTheta - cosTheta;
  float gaussianBloom = exp(-offset*50000.0)*0.5;
  float invBloom = 1.0/(0.02 + offset*300.0)*0.01;
  return vec3(gaussianBloom+invBloom);
}

vec3 jodieReinhardTonemap(vec3 c) {
  // From: https://www.shadertoy.com/view/tdSXzD
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 tc = c / (c + 1.0);
  return mix(c / (l + 1.0), tc, tc);
}

void main() {
  vec3 rayDir = normalize(viewRay);

  vec3 lum = getValFromSkyLUT(rayDir, uSunDir);

  vec3 sunLum = sunWithBloom(rayDir, uSunDir);
  sunLum = smoothstep(0.002, 1.0, sunLum);
  if (length(sunLum) > 0.0) {
    if (rayIntersectSphere(uEyePos, rayDir, uGroundRadiusMM) >= 0.0) {
      sunLum *= 0.0;
    } else {
      sunLum *= getValFromTLUT(uTransmittance, uEyePos, uSunDir);
    }
  }
  lum += sunLum;

  lum *= 20.0;
  lum = pow(lum, vec3(1.3));
  lum /= (smoothstep(0.0, 0.2, clamp(uSunDir.y, 0.0, 1.0))*2.0 + 0.15);

  lum = jodieReinhardTonemap(lum);

  lum = pow(lum, vec3(1.0/2.2));
  gl_FragColor = vec4(lum, 1);
}
