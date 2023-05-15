struct modelMaterial
{
  vec3 baseColor;
  float alpha;

  float metallic;
  float specular;
  float roughness;

  float occlusion;
  vec3 emissive;

  float anisotropy;

  vec3 normal;
  vec3 normalEC;
  vec3 tangent;

  uint shadingModelId;

  float clearcoat;
  float clearcoatRoughness;
  vec3 clearcoatNormal;
};
