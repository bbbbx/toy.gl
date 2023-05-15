vec2 computeTextureTransform(vec2 texCoord, mat3 textureTransform)
{
  return vec2(textureTransform * vec3(texCoord, 1.0));
}


void handleAlpha(vec3 color, float alpha)
{
#ifdef ALPHA_MODE_MASK
  if (alpha < u_alphaCutoff)
  {
    discard;
  }
#endif
}

#ifdef HAS_NORMALS
vec3 computeNormal(ProcessedAttributes attributes)
{
  // Geometry normal. This is already normalized
  vec3 ng = attributes.normalEC;

  vec3 normal = ng;
#if defined(HAS_NORMAL_TEXTURE)
  vec2 normalTexCoords = TEXCOORD_NORMAL;
  #ifdef HAS_NORMAL_TEXTURE_TRANSFORM
    normalTexCoords = computeTextureTransform(normalTexCoords, u_normalTextureTransform);
  #endif // HAS_NORMAL_TEXTURE_TRANSFORM

  // If HAS_BITANGENTS is set, then HAS_TANGENTS is also set
  #ifdef HAS_BITANGENTS
    vec3 t = attributes.tangentEC;
    vec3 b = attributes.bitangentEC;
    mat3 tbn = mat3(t, b, ng);
    vec3 n = texture(u_normalTexture, normalTexCoords).rgb;
    normal = normalize(tbn * (2.0 * n - 1.0));
  #elif (__VERSION__ == 300) || defined(GL_OES_standard_derivatives)
    vec3 positionEC = attributes.positionEC;
    vec3 pos_dx = dFdx(positionEC);
    vec3 pos_dy = dFdy(positionEC);

    vec3 tex_dx = dFdx(vec3(normalTexCoords, 0.0));
    vec3 tex_dy = dFdy(vec3(normalTexCoords, 0.0));

    vec3 t = (tex_dy.t * pos_dx - tex_dx.t * pos_dy) / (tex_dx.s * tex_dy.t - tex_dy.s * tex_dx.t);
    t = normalize(t - ng * dot(ng, t));

    vec3 b = normalize(cross(ng, t));
    mat3 tbn = mat3(t, b, ng);

    vec3 n = texture(u_normalTexture, normalTexCoords).rgb;
    normal = normalize(tbn * (2.0 * n - 1.0));
  #endif

#endif // defined(HAS_NORMAL_TEXTURE)

#ifdef HAS_DOUBLE_SIDED_MATERIAL
  bool backFacing = gl_FrontFacing == false;
  if (backFacing)
  {
    normal = -normal;
  }
#endif

  return normal;
}
#endif

void materialStage(inout modelMaterial material, ProcessedAttributes attributes)
{
#ifdef HAS_NORMALS
  material.normalEC = computeNormal(attributes);
#endif

  vec4 baseColorWithAlpha = vec4(1.0);
#ifdef HAS_BASE_COLOR_TEXTURE
  vec2 baseColorTexCoords = TEXCOORD_BASE_COLOR;
  #ifdef HAS_BASE_COLOR_TEXTURE_TRANSFORM
    baseColorTexCoords = computeTextureTransform(baseColorTexCoords, u_baseColorTextureTransform);
  #endif

  baseColorWithAlpha = texture(u_baseColorTexture, baseColorTexCoords);
  baseColorWithAlpha = toy_sRGBToLinear(baseColorWithAlpha);

  #ifdef HAS_BASE_COLOR_FACTOR
    baseColorWithAlpha *= u_baseColorFactor;
  #endif

#else

  #ifdef HAS_BASE_COLOR_FACTOR
    baseColorWithAlpha = u_baseColorFactor;
  #endif

#endif // HAS_BASE_COLOR_TEXTURE

  material.baseColor = baseColorWithAlpha.rgb;
  material.alpha = baseColorWithAlpha.a;
  handleAlpha(material.baseColor, material.alpha);

#ifdef HAS_OCCLUSION_TEXTURE
  vec2 occlusionTexCoords = TEXCOORD_OCCLUSION;
  #ifdef HAS_OCCLUSION_TEXTURE_TRANSFORM
    occlusionTexCoords = computeTextureTransform(occlusionTexCoords, u_occlusionTextureTransform);
  #endif

  material.occlusion = texture(u_occlusionTexture, occlusionTexCoords).r;
#endif // HAS_OCCLUSION_TEXTURE

#ifdef HAS_EMISSIVE_TEXTURE
  vec2 emissiveTexCoords = TEXCOORD_EMISSIVE;
  #ifdef HAS_EMISSIVE_TEXTURE_TRANSFORM
    emissiveTexCoords = computeTextureTransform(emissiveTexCoords, u_emissiveTextureTransform);
  #endif

  vec3 emissive = texture(u_emissiveTexture, emissiveTexCoords).rgb;
  emissive = toy_sRGBToLinear(emissive);

  #ifdef HAS_EMISSIVE_FACTOR
    emissive *= u_emissiveFactor;
  #endif

  material.emissive = emissive;

#elif defined(HAS_EMISSIVE_FACTOR)
  material.emissive = u_emissiveFactor;
#endif // HAS_EMISSIVE_TEXTURE

#ifdef USE_EMISSIVE_STRENGTH
  #ifdef HAS_EMISSIVE_STRENGTH
    material.emissive *= u_emissiveStrength;
  #endif
#endif

#ifdef USE_METALLIC_ROUGHNESS
  #ifdef HAS_METALLIC_ROUGHNESS_TEXTURE
    vec2 metallicRoughnessTexCoords = TEXCOORD_METALLIC_ROUGHNESS;
    #ifdef HAS_METALLIC_ROUGHNESS_TEXTURE_TRANSFORM
      metallicRoughnessTexCoords = computeTextureTransform(metallicRoughnessTexCoords, u_metallicRoughnessTextureTransform);
    #endif

    vec3 metallicRoughness = texture(u_metallicRoughnessTexture, metallicRoughnessTexCoords).rgb;
    float metallic = metallicRoughness.b;
    float roughness = metallicRoughness.g;

    #ifdef HAS_METALLIC_FACTOR
      metallic *= u_metallicFactor;
    #endif

    #ifdef HAS_ROUGHNESS_FACTOR
      roughness *= u_roughnessFactor;
    #endif

  #else
    #ifdef HAS_METALLIC_FACTOR
      float metallic = u_metallicFactor;
    #else
      float metallic = 1.0;
    #endif

    #ifdef HAS_ROUGHNESS_FACTOR
      float roughness = u_roughnessFactor;
    #else
      float roughness = 1.0;
    #endif

  #endif

  material.metallic = metallic;
  material.roughness = roughness;

#endif // USE_METALLIC_ROUGHNESS

#ifdef USE_SPECULAR
  float specular = 0.5;

  #ifdef HAS_SPECULAR_TEXTURE
    vec2 specularTexCoords = TEXCOORD_SPECULAR;
    #ifdef HAS_SPECULAR_TEXTURE_TRANSFORM
      specularTexCoords = computeTextureTransform(specularTexCoords, u_specularTextureTransform);
    #endif

    specular = texture(u_specularTexture, specularTexCoords).a;

    #ifdef HAS_SPECULAR_FACTOR
      specular *= u_specularFactor;
    #endif


  #elif defined(HAS_SPECULAR_FACTOR)
    specular = u_specularFactor;
  #endif

  material.specular = specular;

#endif // USE_SPECULAR

#ifdef USE_CLEARCOAT
  float clearcoat = 0.0;

  #ifdef HAS_CLEARCOAT_TEXTURE
    vec2 clearcoatTexCoords = TEXCOORD_CLEARCOAT;
    #ifdef HAS_CLEARCOAT_TEXTURE_TRANSFORM
      clearcoatTexCoords = computeTextureTransform(clearcoatTexCoords, u_clearcoatTextureTransform);
    #endif

    clearcoat = texture(u_clearcoatTexture, clearcoatTexCoords).r;

    #ifdef HAS_CLEARCOAT_FACTOR
      clearcoat *= u_clearcoatFactor;
    #endif

  #elif defined(HAS_CLEARCOAT_FACTOR)
    clearcoat = u_clearcoatFactor;
  #endif

  material.clearcoat = clearcoat;

  float clearcoatRoughness = 0.0;
  #ifdef HAS_CLEARCOAT_ROUGHNESS_TEXTURE
    vec2 clearcoatRoughnessTexCoords = TEXCOORD_CLEARCOAT_ROUGHNESS;
    #ifdef HAS_CLEARCOAT_ROUGHNESS_TEXTURE_TRANSFORM
      clearcoatRoughnessTexCoords = computeTextureTransform(clearcoatRoughnessTexCoords, u_clearcoatRoughnessTextureTransform);
    #endif

    clearcoatRoughness = texture(u_clearcoatRoughnessTexture, clearcoatRoughnessTexCoords).g;

    #ifdef HAS_CLEARCOAT_ROUGHNESS_FACTOR
      clearcoatRoughness *= u_clearcoatRoughnessFactor;
    #endif

  #elif defined(HAS_CLEARCOAT_ROUGHNESS_FACTOR)
    clearcoatRoughness = u_clearcoatRoughnessFactor;
  #endif

  material.clearcoatRoughness = clearcoatRoughness;

  #ifdef HAS_CLEARCOAT_NORMAL_TEXTURE
    vec2 clearcoatNormalTexCoords = TEXCOORD_CLEARCOAT_NORMAL;
    #ifdef HAS_CLEARCOAT_NORMAL_TEXTURE_TRANSFORM
      clearcoatNormalTexCoords = computeTextureTransform(clearcoatNormalTexCoords, u_clearcoatNormalTextureTransform);
    #endif

    vec3 clearcoatNormal = texture(u_clearcoatNormalTexture, clearcoatNormalTexCoords).rgb;
    material.clearcoatNormal = clearcoatNormal;

  #endif

#endif // USE_CLEARCOAT

  // Material property
  material.shadingModelId = u_shadingModelId;
}
