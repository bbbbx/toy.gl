uniform vec4 uTransmittanceLutSizeAndInvSize;
uniform vec4 uMultiScatteredLuminanceLutSizeAndInvSize;
uniform vec4 uSkyViewLutSizeAndInvSize;

uniform sampler2D uTransmittanceLutTexture;
uniform sampler2D uMultiScatteredLuminanceLutTexture;
uniform sampler2D uDistantSkyLightLutTexture;
uniform sampler2D uSkyViewLutTexture;

uniform float uGroundRadiusMM;
uniform float uAtmosphereRadiusMM;
// uniform float uStepCount;
uniform vec3 uViewPos;

// View. related
uniform float uAtmosphereLightDiscCosHalfApexAngle[2];
uniform vec3 uAtmosphereLightDiscLuminance[2];
uniform vec3 uAtmosphereLightIlluminanceOuterSpace[2];
uniform vec3 uAtmosphereLightDirection[2];
uniform vec4 uAtmosphereLightColor[2];
uniform mat3 uSkyViewLutReferential;


#ifndef SECOND_ATMOSPHERE_LIGHT_ENABLED
#define SECOND_ATMOSPHERE_LIGHT_ENABLED 1
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
  // const float k = 3./4.;
  return k*(1.0+cosTheta*cosTheta);
}

const vec3 EarthRayleighScatteringBase = vec3(5.802, 13.558, 33.1); // 10^-6/m for lambda=(680,550,440)nm
// beta: 8 * Math.PI**3 * (n**2-1)**2 / (3 * N * lambda**4), unit(1/m)
//   lambda = 680 * 1e-9;
//   sea level air density = 1.293kg/L
//   N_A = 6.02 * 1e23
//   N2 = 28
//   O2 = 32
//   average = 31
//   N(molercular number density, 1/m^3) = (1.293kg / 0.012kg) * (12/31) * N_A = 2.51*1e25;
// 
//   n = 1.00029;
// const vec3 EarthRayleighScatteringBase = vec3(6.2862880515770465, 14.688558265154152, 35.86073795203651);
const vec3 EarthRayleighAbsorptionBase = vec3(0.0);
const vec3 EarthMieScatteringBase = vec3(3.996);
const vec3 EarthMieAbsorptionBase = vec3(4.40);
const vec3 EarthOzoneScatteringBase = vec3(0.0);
const vec3 EarthOzoneAbsorptionBase = vec3(0.650, 1.881, 0.085);

// 把大气的参与介质建模为 (瑞利粒子+米氏粒子+其他粒子)
// Atmopshere Particulate Medium = (rayleigh particle, mie particle, other particle)
struct MediumSampleRGB {
  // 瑞利粒子，例如地球上的空气分子
  vec3 scatteringRayleigh;
  vec3 absorptionRayleigh;
  vec3 extinctionRayleigh;

  // 米氏粒子，例如地球上的气溶胶
  // aerosols
  vec3 scatteringMie;
  vec3 absorptionMie;
  vec3 extinctionMie;

  // 其他粒子，例如地球上的臭氧
  vec3 scatteringOther;
  vec3 absorptionOther;
  vec3 extinctionOther;

  // 所有的粒子
  vec3 scattering;
  vec3 absorption;
  vec3 extinction;

  // scattering/extinction
  vec3 albedo;
};
MediumSampleRGB SampleMediumRGB(vec3 worldPosMM) {
  float altitudeKM = (length(worldPosMM) - uGroundRadiusMM) * 1e3;

  float rayleighDensity = exp(-altitudeKM / 8.0);
  float mieDensity = exp(-altitudeKM / 1.2);
  float otherDensity = max(0.0, 1. - abs(altitudeKM - 25.)/15.);

  MediumSampleRGB s;
  s.scatteringRayleigh = rayleighDensity * EarthRayleighScatteringBase;
  s.absorptionRayleigh = rayleighDensity * EarthRayleighAbsorptionBase;
  s.extinctionRayleigh = s.scatteringRayleigh + s.absorptionRayleigh;

  s.scatteringMie = mieDensity * EarthMieScatteringBase;
  s.absorptionMie = mieDensity * EarthMieAbsorptionBase;
  s.extinctionMie = s.scatteringMie + s.absorptionMie;

  s.scatteringOther = otherDensity * EarthOzoneScatteringBase;
  s.absorptionOther = otherDensity * EarthOzoneAbsorptionBase;
  s.extinctionOther = s.scatteringOther + s.absorptionOther;

  s.scattering = s.scatteringRayleigh + s.scatteringMie + s.scatteringOther;
  s.absorption = s.absorptionRayleigh + s.absorptionMie + s.absorptionOther;
  s.extinction = s.extinctionRayleigh + s.extinctionMie + s.extinctionOther;

  s.albedo = s.scattering / max(vec3(0.001), s.extinction);

  return s;
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


// void getTransmittanceLutUvs(
//   in float viewHeight, in float viewZenithCosAngle, in float BottomRadius, in float TopRadius,
//   out vec2 UV)
// {
//   float H = sqrt(max(0.0, TopRadius * TopRadius - BottomRadius * BottomRadius));
//   float Rho = sqrt(max(0.0, viewHeight * viewHeight - BottomRadius * BottomRadius));

//   float Discriminant = viewHeight * viewHeight * (viewZenithCosAngle * viewZenithCosAngle - 1.0) + TopRadius * TopRadius;
//   float D = max(0.0, (-viewHeight * viewZenithCosAngle + sqrt(Discriminant))); // Distance to atmosphere boundary

//   float Dmin = TopRadius - viewHeight;
//   float Dmax = Rho + H;
//   float Xmu = (D - Dmin) / (Dmax - Dmin);
//   float Xr = Rho / H;

//   UV = vec2(Xmu, Xr);
//   //UV = float2(fromUnitToSubUvs(UV.x, TRANSMITTANCE_TEXTURE_WIDTH), fromUnitToSubUvs(UV.y, TRANSMITTANCE_TEXTURE_HEIGHT)); // No real impact so off
// }
// void LutTransmittanceParamsToUv(in float cosZenith, in float heightMM, out vec2 uv) {
//   getTransmittanceLutUvs(heightMM, cosZenith, uGroundRadiusMM, uAtmosphereRadiusMM, uv);
// }

vec3 getTransmittance(float cosZenith, float heightMM) {
  // vec2 uv;
  // LutTransmittanceParamsToUv(cosZenith, heightMM, uv);
  vec2 uv = vec2(
    clamp(cosZenith * 0.5 + 0.5, 0.0, 1.0),
    (heightMM - uGroundRadiusMM) / (uAtmosphereRadiusMM-uGroundRadiusMM)
  );
  return texture2D(uTransmittanceLutTexture, uv).rgb;
}

vec3 getMultipleScattering(vec3 pos, float cosZenith) {
  vec2 uv = vec2(
    clamp(cosZenith * 0.5 + 0.5, 0., 1.),
    clamp((length(pos) - uGroundRadiusMM) / (uAtmosphereRadiusMM-uGroundRadiusMM), 0., 1.)
  );
  return texture2D(uMultiScatteredLuminanceLutTexture, uv).rgb;
}

#ifndef RAY_MARCHING_SAMPLE_COUNT
#define RAY_MARCHING_SAMPLE_COUNT 32
#endif
vec3 raymarchScattering(
  vec3 pos,
  vec3 rayDir,
  vec3 light0Dir,
  vec3 light1Dir,
  vec3 light0Illuminance,
  vec3 light1Illuminance
) {
  float tBottom = rayIntersectSphere(pos, rayDir, uGroundRadiusMM);
  float tTop = rayIntersectSphere(pos, rayDir, uAtmosphereRadiusMM);
  float tMax = 0.0;
  if (tBottom < 0.0) {
    if (tTop < 0.0) { // intersect with nothing
      tMax = 0.0;
      return vec3(0);
    } else {
      tMax = tTop;
    }
  } else {
    if (tTop > 0.0) {
      tMax = min(tTop, tBottom);
    }
  }
  tMax = min(9000000.0, tMax);
  // return vec3(tMax);

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
  for (int i = 0; i < RAY_MARCHING_SAMPLE_COUNT; i++) {
    float newT = ((float(i) + 0.3)/float(RAY_MARCHING_SAMPLE_COUNT))*tMax;
    float dt = newT - t;
    t = newT;

    vec3 newPos = pos + t * rayDir;
    float pHeight = length(newPos);
    vec3 upVector = newPos / pHeight;

    MediumSampleRGB medium = SampleMediumRGB(newPos);
    vec3 sampleTransmittance = exp(-dt * medium.extinction /* * AerialPespectiveViewDistanceScale */);

    // vec3 lightDir = uAtmosphereLightDirection[0];
    // Phase and transmittance for light 0
    float light0ZenithCosAngle = dot(light0Dir, upVector);
    vec3 transmittanceToLight0 = getTransmittance(light0ZenithCosAngle, pHeight);
    vec3 phaseTimesScattering0 = medium.scatteringMie * miePhaseValue0 + medium.scatteringRayleigh * rayleighPhaseValue0;

#if SECOND_ATMOSPHERE_LIGHT_ENABLED
    // Phase and transmittance for light 1
    float light1ZenithCosAngle = dot(light1Dir, upVector);
    vec3 transmittanceToLight1 = getTransmittance(light1ZenithCosAngle, pHeight);
    vec3 phaseTimesScattering1 = medium.scatteringMie * miePhaseValue1 + medium.scatteringRayleigh * rayleighPhaseValue1;
#endif

    // Multiple scattering approximation
    vec3 multiScatteredLuminance0 = getMultipleScattering(newPos, light0ZenithCosAngle);

    float tPlanet0 = rayIntersectSphere(newPos, light0Dir, uGroundRadiusMM);
    float planetShadow0 = mix(1.0, 0.0, float(tPlanet0 >= 0.));
    // MultiScatteredLuminance is already pre-exposed, atmospheric light contribution needs to be pre exposed
    vec3 S = exposedLight0Illuminance *
      (planetShadow0 * transmittanceToLight0 * phaseTimesScattering0 + multiScatteredLuminance0 * medium.scattering);

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
    vec3 Sint = (S - S * sampleTransmittance) / medium.extinction;
    L += transmittance * Sint;
#endif
    transmittance *= sampleTransmittance;
  }

  return L;
}
