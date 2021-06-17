precision highp float;

struct Light {
  vec3 color;
  vec3 direction;
  vec3 position;
  float intensity;
  float type;
};
const float LightType_Directional = 0.0;
const float LightType_Point = 1.0;
const float LightType_Spot = 2.0;

uniform Light u_light;
uniform vec4 u_baseColor;
uniform float u_metallic;
uniform float u_roughness;
#define MIN_ROUGHNESS 0.05
#define DIELECTRIC_SPECULAR 0.04

uniform mat4 u_viewMatrix;

uniform sampler2D u_GGXLUT;
uniform samplerCube u_diffuseIrradiance;
uniform samplerCube u_specularRadiance0;
uniform samplerCube u_specularRadiance1;
uniform samplerCube u_specularRadiance2;
uniform samplerCube u_specularRadiance3;
uniform samplerCube u_specularRadiance4;

uniform vec3 u_eye;

varying vec3 v_positionWC;
varying vec2 v_uv;
varying vec3 v_normalWC;

const float M_PI = 3.141592653589793;

vec3 F_Schlick(vec3 f0, vec3 f90, float VdotH) {
  return f0 + (f90 - f0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

// Smith Joint GGX
// Note: Vis = G / (4 * NdotL * NdotV)
float V_GGX(float NdotL, float NdotV, float alphaRoughness) {
  float alphaRoughnessSq = alphaRoughness * alphaRoughness;

  float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);
  float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - alphaRoughnessSq) + alphaRoughnessSq);

  float GGX = GGXV + GGXL;
  if (GGX > 0.0)
  {
    return 0.5 / GGX;
  }
  return 0.0;
}

// The following equation(s) model the distribution of microfacet normals across the area being drawn (aka D())
// Implementation from "Average Irregularity Representation of a Roughened Surface for Ray Reflection" by T. S. Trowbridge, and K. P. Reitz
// Follows the distribution function recommended in the SIGGRAPH 2013 course notes from EPIC Games [1], Equation 3.
// https://github.com/EpicGames/UnrealEngine/blob/c3caf7b6bf12ae4c8e09b606f10a09776b4d1f38/Engine/Shaders/Private/BRDF.ush#L318
float D_GGX(float NdotH, float alphaRoughness) {
  float a2 = alphaRoughness * alphaRoughness;
  float d = ( NdotH * a2 - NdotH ) * NdotH + 1.0; // 2 mad
  return a2 / (M_PI * d * d);                     // 4 mul, 1 rcp
}

// https://docs.microsoft.com/en-us/windows/win32/direct3dhlsl/rcp
float rcp(float a) {
  return 1.0 / a;
}

// [Gotanda 2012, "Beyond a Simple Physically Based Blinn-Phong Model in Real-Time"]
vec3 Diffuse_OrenNayar( vec3 DiffuseColor, float Roughness, float NoV, float NoL, float VoH )
{
	float a = Roughness * Roughness;
	float s = a;// / ( 1.29 + 0.5 * a );
	float s2 = s * s;
	float VoL = 2.0 * VoH * VoH - 1.0;		// double angle identity
	float Cosri = VoL - NoV * NoL;
	float C1 = 1.0 - 0.5 * s2 / (s2 + 0.33);
	float C2 = 0.45 * s2 / (s2 + 0.09) * Cosri * ( Cosri >= 0.0 ? rcp( max( NoL, NoV ) ) : 1.0 );
	return DiffuseColor / M_PI * ( C1 + C2 ) * ( 1.0 + Roughness * 0.5 );
}

vec3 BRDF_diffuseOrenNayar(vec3 f0, vec3 f90, vec3 diffuseColor, float specularWeight, float VdotH, float NdotV, float NdotL, float roughness) {
  vec3 L = Diffuse_OrenNayar(diffuseColor, roughness, NdotV, NdotL, VdotH);
  return (1.0 - (specularWeight * F_Schlick(f0, f90, VdotH))) * L;
}

// diffuse BRDF
vec3 BRDF_lambertian(vec3 f0, vec3 f90, vec3 diffuseColor, float specularWeight, float VdotH) {
  return (1.0 - (specularWeight * F_Schlick(f0, f90, VdotH))) * (diffuseColor / M_PI);
}

// specular BRDF
vec3 BRDF_specularGGX(vec3 f0, vec3 f90, float alphaRoughness, float specularWeight, float VdotH, float NdotL, float NdotV, float NdotH) {
  vec3 F = F_Schlick(f0, f90, VdotH);
  float Vis = V_GGX(NdotL, NdotV, alphaRoughness);
  float D = D_GGX(NdotH, alphaRoughness);
  // return vec3(D);
  // D = D == 0.0 ? 1.0 : D;
  return specularWeight * F * Vis * D;
}

vec3 getDiffuseLight(vec3 n) {
  return textureCube(u_diffuseIrradiance, n).rgb;
}

// specularWeight is introduced with KHR_materials_specular
vec3 getIBLRadianceLambertian_SS(vec3 N, vec3 V, float roughness, vec3 diffuseColor, vec3 F0, float specularWeight) {
  vec3 irradiance = vec3(0.5);

  return diffuseColor * irradiance;
}

vec3 getIBLRadianceGGX_SS(vec3 n, vec3 v, float roughness, vec3 F0, float specularWeight)
{
  float NdotV = clamp(dot(n, v), 0.0, 1.0);
  vec4 specularSample = vec4(0.5);
  vec3 specularLight =  specularSample.rgb;

  vec2 brdfSamplePoint = clamp(vec2(NdotV, roughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
  vec2 f_ab = texture2D(u_GGXLUT, brdfSamplePoint).rg;

  return (F0 * f_ab.x + f_ab.y) * specularLight;
}

vec3 getIBLRadianceLambertian(vec3 N, vec3 V, float roughness, vec3 diffuseColor, vec3 F0, float specularWeight) {
  float NdotV = clamp(dot(N, V), 0.0, 1.0);
  vec2 brdfSamplePoint = clamp(vec2(NdotV, roughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
  vec2 f_ab = texture2D(u_GGXLUT, brdfSamplePoint).rg;

  // vec3 irradiance = vec3(0.5);
  vec3 irradiance = getDiffuseLight(N);

  // see https://bruop.github.io/ibl/#single_scattering_results at Single Scattering Results
  // Roughness dependent fresnel, from Fdez-Aguera
  vec3 Fr = max(vec3(1.0 - roughness), F0) - F0;
  vec3 k_S = F0 + Fr * pow(1.0 - NdotV, 5.0);
  vec3 FssEss = specularWeight * k_S * f_ab.x + f_ab.y; // <--- GGX / specular light contribution (scale it down if the specularWeight is low)

  // Multiple scattering, from Fdez-Aguera
  float Ems = (1.0 - (f_ab.x + f_ab.y));
  vec3 F_avg = (F0 + (1.0 - F0) / 21.0);
  vec3 FmsEms = Ems * FssEss * F_avg / (1.0 - F_avg * Ems);

  vec3 k_D = diffuseColor * (1.0 - FssEss + FmsEms); // we use +FmsEms as indicated by the formula in the blog post (might be a typo in the implementation)

  return (FmsEms + k_D) * irradiance;
}

vec3 getIBLRadianceGGX(vec3 n, vec3 v, float roughness, vec3 F0, float specularWeight)
{
  // TODO: pass by uniform
  float u_MipCount = 5.0;
  float NdotV = clamp(dot(n, v), 0.0, 1.0);
  float lod = roughness * float(u_MipCount - 1.0);
  vec3 reflection = normalize(reflect(-v, n));

  // vec4 specularSample = getSpecularSample(reflection, lod);
  // vec4 specularSample = vec4(0.5);
  // vec3 specularLight =  specularSample.rgb;

  float prevLod = floor(lod);
  float nextLod = prevLod + 1.0;
  vec4 specularSample1 = textureCube(u_specularRadiance${prevLod}, reflection);
  vec4 specularSample2 = textureCube(u_specularRadiance${nextLod}, reflection);
  vec3 specularLight = mix(specularSample1, specularSample2, lod - prevLod).rgb;

  // Roughness dependent fresnel, from Fdez-Aguera
  vec3 Fr = max(vec3(1.0 - roughness), F0) - F0;
  vec3 k_S = F0 + Fr * pow(1.0 - NdotV, 5.0);

  vec2 brdfSamplePoint = clamp(vec2(NdotV, roughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
  vec2 f_ab = texture2D(u_GGXLUT, brdfSamplePoint).rg;
  // 一般写成：FssEss = F0 * f_ab.x + f_ab.y;
  vec3 FssEss = k_S * f_ab.x + f_ab.y;

  return specularWeight * FssEss * specularLight;
}

vec3 getLightIntensity(Light light, vec3 positionWC) {
  vec3 lightColor = light.color;
  vec3 lightPosition = light.position;
  float lightIntensity = light.intensity;
  float lightType = light.type;

  vec3 intensity = vec3(0.0);

  if (lightType == LightType_Directional) {
    intensity = lightColor * lightIntensity;
  } else if (lightType == LightType_Point) {
    float r = distance(positionWC, lightPosition);
    intensity = lightColor * lightIntensity / (r*r);
  } else if (lightType == LightType_Spot) {

  }

  return intensity;
}

void main() {
  
  vec4 albedo = u_baseColor;
  float metallic = u_metallic;
  // roughness 最低为 0.1，防止 GGX NDF 为 0？或者 remap 到 [MIN_ROUGHNESS, 1]？
  // 如果原 roughness 已经是计算好的（和最终的结果一样），则 remap 会丢失精度
  float roughness = (1.0 - MIN_ROUGHNESS) * u_roughness;
  float alphaRoughness = roughness * roughness;

// Material Properties:
  // metallic 越大，diffuseColor 越小。
  // metallic 为 1 时，diffuseColor 为 0，
  // metallic 为 0 时，diffuseColor 最多只有 albedo 的 96%
  vec3 diffuseColor = mix(albedo.rgb * vec3(1.0 - DIELECTRIC_SPECULAR), vec3(0.0), metallic);
  // vec3 diffuseColor = albedo.rgb * (vec3(1.0) - f0) * (1.0 - metallic);
  // metallic 越大，f0 越接近 albedo，这里是 V = N 时，specular 的反照率
  // metallic 为 1 时，f0 为 albedo，
  // metallic 为 0 时，f0 为 vec3(0.4)。
  vec3 f0 = mix(vec3(DIELECTRIC_SPECULAR), albedo.rgb, metallic);
  vec3 f90 = vec3(1.0);
  float specularWeight = 1.0;

  // vec3 N = normalize((u_viewMatrix * vec4(v_normalEC, 1.0)).xyz);
  vec3 N = normalize(v_normalWC);
  vec3 pointWC = v_positionWC;
  vec3 V = normalize(u_eye - pointWC);
  // gl_FragColor = textureCube(u_specularRadiance4, N);
  // return;

  vec3 diffuse = vec3(0.0);
  vec3 specular = vec3(0.0);

// IBL:
  diffuse += getIBLRadianceLambertian(N, V, roughness, diffuseColor, f0, specularWeight);
  specular += getIBLRadianceGGX(N, V, roughness, f0, specularWeight);

  // for each punctual light:
    vec3 L = vec3(0.0);
    float lightType = u_light.type;
    if (lightType == LightType_Directional) {
      L = normalize(-u_light.direction);
    } else if (lightType == LightType_Point || lightType == LightType_Spot) {
      L = normalize(u_light.position - pointWC);
    }

    vec3 H = normalize(L + V);
    float NdotL = clamp(dot(N, L), 0.0, 1.0);
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    float NdotH = clamp(dot(N, H), 0.0, 1.0);
    float LdotH = clamp(dot(L, H), 0.0, 1.0);
    float VdotH = clamp(dot(V, H), 0.0, 1.0);

    if (NdotL > 0.0 || NdotV > 0.0) {
      vec3 intensity = getLightIntensity(u_light, pointWC);

      // diffuse += intensity * NdotL * BRDF_lambertian(f0, f90, diffuseColor, specularWeight, VdotH);
      diffuse += intensity * NdotL * BRDF_diffuseOrenNayar(f0, f90, diffuseColor, specularWeight, VdotH, NdotV, NdotL, roughness);
      specular += intensity * NdotL * BRDF_specularGGX(f0, f90, alphaRoughness, specularWeight, VdotH, NdotL, NdotV, NdotH);
    }

  vec3 color = diffuse + specular;
  gl_FragColor = vec4(color, 1);

  // vec2 brdfSamplePoint = clamp(vec2(NdotV, roughness), vec2(0.0, 0.0), vec2(1.0, 1.0));
  // vec2 f_ab = texture2D(u_GGXLUT, brdfSamplePoint).rg;
  // gl_FragColor = vec4(f_ab, 0, 1);
  // gl_FragColor = vec4(roughness, 0, 0, 1);
}