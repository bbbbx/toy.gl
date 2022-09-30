uniform vec4 uTransmittanceLutSizeAndInvSize;
uniform vec4 uMultiScatteredLuminanceLutSizeAndInvSize;
uniform vec4 uSkyViewLutSizeAndInvSize;

uniform float uGroundRadiusMM;
uniform float uAtmosphereRadiusMM;
// uniform float uStepCount;

// View. related
uniform float uAtmosphereLightDiscCosHalfApexAngle[2];
uniform vec3 uAtmosphereLightDiscLuminance[2];
uniform vec3 uAtmosphereLightIlluminanceOuterSpace[2];
uniform vec3 uAtmosphereLightDirection[2];
uniform vec4 uAtmosphereLightColor[2];
uniform mat3 uSkyViewLutReferential;


#ifndef SECOND_ATMOSPHERE_LIGHT_ENABLED
#define SECOND_ATMOSPHERE_LIGHT_ENABLED 0
#endif

#define PI 3.141592653589793

const vec3 groundAlbedo = vec3(0.4);

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
const vec3 rayleighAbsorptionBase = vec3(0.0);
const vec3 mieScatteringBase = vec3(3.996);
const vec3 mieAbsorptionBase = vec3(4.40);
const vec3 ozoneAbsorptionBase = vec3(0.650, 1.881, 0.085);

/**
 * eyePos: MM 单位
 */
void getScatteringValues(vec3 eyePos,
  out vec3 rayleighScattering,
  out vec3 mieScattering,
  out vec3 extinction
) {
  float altitudeKM = (length(eyePos) - uGroundRadiusMM) * 1000.0;

  // Note: Paper gets these switched up.
  float rayleighDensity = exp(-altitudeKM/8.0); // H_R=8.0KM
  float mieDensity = exp(-altitudeKM/1.2);      // H_M=1.2KM

  rayleighScattering = rayleighScatteringBase * rayleighDensity;
  vec3 rayleighAbsorption = rayleighAbsorptionBase * rayleighDensity;

  mieScattering = mieScatteringBase * mieDensity;
  vec3 mieAbsorption = mieAbsorptionBase * mieDensity;

  vec3 ozoneAbsorption = max(0.0, 1. - abs(altitudeKM - 25.)/15.) * ozoneAbsorptionBase;

  extinction =
    rayleighScattering + rayleighAbsorption +
    mieScattering + mieAbsorption +
    ozoneAbsorption;
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



// SkyViewLUT 的参数是视角方向，传 viewHeight 是为了确定地平线对应的角度，
// 以便分多点 texel 给地平线附近方向。
void UvToSkyViewLutParams(out vec3 viewDir, in float viewHeight, in vec2 uv) {
  float vHorizon = sqrt(viewHeight*viewHeight - uGroundRadiusMM*uGroundRadiusMM);
  float cosBeta = vHorizon / viewHeight; // cos of zenith angle from horizon to zeniht
  float beta = acos(cosBeta);
  float zenithHorizonAngle = PI - beta;

  float viewZenithAngle;
  if (uv.y < 0.5) {
    float coord = 1.0 - 2.0*uv.y;
    coord *= coord;
    coord = 1.0 - coord;
    viewZenithAngle = zenithHorizonAngle * coord;
  } else {
    float coord = 2.0 * uv.y - 1.0;
    coord *= coord;
    viewZenithAngle = zenithHorizonAngle + beta * coord;
  }
  float cosViewZenithAngle = cos(viewZenithAngle);
  // float sinViewZenithAngle = sqrt(1.0 - cosViewZenithAngle * cosViewZenithAngle) * mix(-1., 1., float(viewZenithAngle > 0.0)); // Equivalent to sin(ViewZenithAngle)
  float sinViewZenithAngle = sin(viewZenithAngle);

  float longitudeViewCosAngle = uv.x * 2.0 * PI;
  float cosLongitudeViewCosAngle = cos(longitudeViewCosAngle);
  // float sinLongitudeViewCosAngle = sqrt(1.0 - cosLongitudeViewCosAngle * cosLongitudeViewCosAngle) * mix(-1., 1., float(longitudeViewCosAngle <= PI)); // Equivalent to sin(LongitudeViewCosAngle)
  float sinLongitudeViewCosAngle = sin(longitudeViewCosAngle);

  // Z up
  viewDir = vec3(
    sinViewZenithAngle * cosLongitudeViewCosAngle,
    sinViewZenithAngle * sinLongitudeViewCosAngle,
    cosViewZenithAngle
    );
}

void SkyViewLutParamsToUv(in vec3 viewDir, in float viewHeight, out vec2 uv) {
  float vHorizon = sqrt(viewHeight*viewHeight - uGroundRadiusMM*uGroundRadiusMM);
  float cosBeta = vHorizon / viewHeight;
  float beta = acos(cosBeta);
  // Angle between horizon and zenith
  float horizonZenithAngle = PI - beta;
  // View in local reference is Z-up
  vec3 up = vec3(0, 0, 1);
  // float cosViewZenithAngle = dot(up, viewDir);
  float cosViewZenithAngle = viewDir.z;
  // Angle between view and zenith
  float viewZenithAngle = acos(cosViewZenithAngle);

  if (viewZenithAngle < horizonZenithAngle) { // viewDir intersects with atmosphere
    float absOfLOverPIOverTwo = 1.0 - (viewZenithAngle/horizonZenithAngle);
    uv.y = 0.5 - 0.5 * sqrt(absOfLOverPIOverTwo);

    // float Coord = viewZenithAngle / horizonZenithAngle;
		// Coord = 1.0 - Coord;
		// Coord = sqrt(Coord);
		// Coord = 1.0 - Coord;
		// uv.y = Coord * 0.5;
  } else { // viewDir intersects with ground
    float absOfLOverPIOverTwo = (viewZenithAngle - horizonZenithAngle) / beta;
    uv.y = 0.5 + 0.5 * sqrt(absOfLOverPIOverTwo);
  }

  // nagate xy for starting at positive x axsi, instead of  nagative x axis
  uv.x = (atan(-viewDir.y, -viewDir.x) + PI) / (2.0*PI);
}