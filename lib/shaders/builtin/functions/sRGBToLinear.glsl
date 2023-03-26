vec3 toy_sRGBToLinear(vec3 sRGB)
{
  return pow(sRGB.rgb, vec3(2.2));
}

vec4 toy_sRGBToLinear(vec4 sRGB)
{
  return vec4(toy_sRGBToLinear(sRGB.rgb), sRGB.a);
}
