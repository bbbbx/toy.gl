layout (location = 0) out vec4 outColor0;
layout (location = 1) out vec4 outColor1;
layout (location = 2) out vec4 outColor2;
layout (location = 3) out vec4 outColor3;
layout (location = 4) out vec4 outColor4;
layout (location = 5) out vec4 outColor5;
layout (location = 6) out vec4 outColor6;
layout (location = 7) out vec4 outColor7;

modelMaterial getDefaultModelMaterial()
{
  modelMaterial material;

  material.baseColor = vec3(1.0, 0.0, 1.0);
  material.alpha = 1.0;
  material.metallic = 1.0;
  material.specular = 0.0;
  material.roughness = 1.0;

  material.occlusion = 1.0;
  material.emissive = vec3(0.0);

  material.anisotropy = 0.0;

  material.normal = vec3(0.0, 0.0, 1.0);
  material.normalEC = vec3(0.0, 0.0, 1.0);
  material.tangent = vec3(1.0, 0.0, 0.0);

  material.shadingModelId = 0;

  material.clearcoat = 0.0;
  material.clearcoatRoughness = 0.0;
  material.clearcoatNormal = vec3(0.0, 0.0, 1.0);

  return material;
}

vec4 handleAlpha(vec3 color, float alpha)
{
#ifdef ALPHA_MODE_MASK
  if (alpha < u_alphaCutoff)
  {
    discard;
  }
#endif

  return vec4(color, alpha);
}

void main()
{
  ProcessedAttributes attributes;
  geometryStage(attributes);

  modelMaterial material = getDefaultModelMaterial();
  materialStage(material, attributes);

  // vec4 color = lightingStage(material, attributes);

#ifdef HAS_PRIMITIVE_OUTLINE
  // primitiveOutlineStage(material);
#endif

  // color = handleAlpha(color);

  outColor0.rgb = material.emissive;
  outColor1.rgb = normalize(material.normalEC);
  outColor2 = vec4(material.metallic, material.specular, material.roughness, float(material.shadingModelId) / 255.0);
  outColor3 = vec4(material.baseColor, material.occlusion);

  // TODO:
  outColor4 = vec4(material.clearcoat, material.clearcoatRoughness, 0.0, 0.0);
  outColor5 = vec4(0.0);

  outColor6 = vec4(material.tangent, material.anisotropy);

  outColor7 = vec4(material.clearcoatNormal, 0.0);

#if 1
  outColor1.rg = toy_UnitVectorToOctahedron(outColor1.rgb) * 0.5 + 0.5;
  outColor1.b = 0.0;
#endif
}
