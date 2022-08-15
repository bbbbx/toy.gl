uniform vec2 uResolution;

uniform float uGroundRadiusMM;
uniform float uAtmosphereRadiusMM;
uniform float uStepCount;

#define PI 3.141592653589793

const vec3 groundAlbedo = vec3(0.3);

float safeAcos(float x) {
  return acos(clamp(x, -1.0, 1.0));
}

// From https://gamedev.stackexchange.com/questions/96459/fast-ray-sphere-collision-code.
// return intersection distance, returns -1 means no intersections
float rayIntersectSphere(vec3 ro, vec3 rd, float rad) {
  float b = dot(ro, rd);
  float c = dot(ro, ro) - rad*rad;
  if (c > 0.0 && b > 0.0) return -1.0;
  float discr = b*b - c;
  if (discr < 0.0) return -1.0;
  // Special case: inside sphere, use far discriminant
  if (discr > b*b) return (-b + sqrt(discr));
  return -b - sqrt(discr);
}


float getMiePhase(float cosTheta) {
  const float g = 0.8;
  const float scale = 3.0/(8.0*PI);
  
  float num = (1.0-g*g)*(1.0+cosTheta*cosTheta);
  float denom = (2.0+g*g)*pow((1.0 + g*g - 2.0*g*cosTheta), 1.5);
  
  return scale*num/denom;
}

float getRayleighPhase(float cosTheta) {
  const float k = 3.0/(16.0*PI);
  return k*(1.0+cosTheta*cosTheta);
}

// 见 2.1
// 见 4.Atmospheric model, Table 1
// These are per megameter.
// 我们假设：
//   1. 瑞丽理论中只有散射，没有吸收，相位函数是 pr(theta)
//   2. 米氏理论有散射和吸收，相位函数是 pm(theta, g)
//   3. 臭氧不散射，只吸收
// 瑞利散射光线的强度与入射光线波长的四次方成反比，
// 而米式散射的程度跟波长是无关的，而且光子散射后的性质也不会改变。
const vec3 rayleighScatteringBase = vec3(5.802, 13.558, 33.1); // 10^-6/m for lambda=(680,550,440)nm
const float rayleighAbsorptionBase = 0.0;
const float mieScatteringBase = 3.996;
const float mieAbsorptionBase = 4.4;
const vec3 ozoneAbsorptionBase = vec3(0.650, 1.881, 0.085);

void getScatteringValues(vec3 eyePos,
  out vec3 rayleighScattering,
  out float mieScattering,
  out vec3 extinction
) {
  float altitudeKM = (length(eyePos) - uGroundRadiusMM) * 1000.0;

  // Note: Paper gets these switched up.
  float rayleighDensity = exp(-altitudeKM/8.0); // H_R=8.0KM
  float mieDensity = exp(-altitudeKM/1.2);      // H_M=1.2KM

  rayleighScattering = rayleighScatteringBase * rayleighDensity;
  float rayleighAbsorption = rayleighAbsorptionBase * rayleighDensity;

  mieScattering = mieScatteringBase * mieDensity;
  float mieAbsorption = mieAbsorptionBase * mieDensity;

  vec3 ozoneAbsorption = max(0.0, 1. - abs(altitudeKM - 25.)/15.) * ozoneAbsorptionBase;

  extinction = rayleighScattering + rayleighAbsorption + mieScattering + mieAbsorption + ozoneAbsorption;
}

vec3 getValFromTLUT(sampler2D LUT, vec3 eyePos, vec3 lightDir) {
  float radius = length(eyePos);
  vec3 up = eyePos / radius;
  float lightCosZenithAngle = dot(lightDir, up);

  float u = lightCosZenithAngle * 0.5 + 0.5;
  // eye 可能在大气外
  float v = max(0.0, min(1.0, (radius-uGroundRadiusMM) / (uAtmosphereRadiusMM-uGroundRadiusMM)));
  return texture2D(LUT, vec2(u, v)).rgb;
}

vec3 getValFromMultiScattLUT(sampler2D LUT, vec3 eyePos, vec3 lightDir) {
  return getValFromTLUT(LUT, eyePos, lightDir);
}

