in vec2 vUV;

uniform sampler2D u_RT0;
uniform sampler2D u_RT1;
uniform sampler2D u_RT2;
uniform sampler2D u_RT3;
uniform sampler2D u_RT4;
uniform sampler2D u_RT5;
uniform sampler2D u_RT6;

#if 0
uniform sampler2D u_environmentTexture;
#endif

layout (location = 0) out vec4 outColor0;

void main() {
  vec2 ScreenUV = vUV;
  vec4 SceneColor = texture(u_RT0, ScreenUV);
  vec4 RT1 = texture(u_RT1, ScreenUV);
  vec4 RT2 = texture(u_RT2, ScreenUV);
  vec4 RT3 = texture(u_RT3, ScreenUV);

  vec3 NormalEC = toy_OctahedronToUnitVector(RT1.xy);

  float Metallic = RT2.r;
  float Specular = RT2.g;
  float Roughness = RT2.b;
  uint ShadingModelId = DecodeShadingModelId(RT2.a);
  if (ShadingModelId == SHADINGMODELID_UNLIT)
  {
    outColor0 = vec4(0);
    return;
  }

  vec3 BaseColor = RT3.rgb;

  outColor0 = vec4(ScreenUV, 0, 1);
  outColor0 = vec4(SceneColor.rgb, 1);
  outColor0 = vec4(Metallic);
  outColor0.rgb = NormalEC;

  vec3 L = vec3(0, 0, -1);
  float NoL = clamp(dot(NormalEC, L), 0.0, 1.0);
  // outColor0.rgb = BaseColor * NoL * 4.0;

#if 0
  outColor0 = texture(u_environmentTexture, NormalEC.xy);
  // outColor0 = texture(u_environmentTexture, ScreenUV.xy);
#endif
}
