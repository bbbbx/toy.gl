uniform sampler2D uColorTexture;
uniform sampler2D uDepthTexture;
uniform mat4 uInverseProjection;
uniform vec4 uBufferSizeAndInv;

varying vec2 vUV;

vec3 clipToEye(vec2 uv, float depth)
{
  vec4 ndc = vec4(uv, depth, 1.0) * 2.0 - 1.0;
#if 0
  vec4 posEC = czm_inverseProjection * ndc;
#else
  vec4 posEC = uInverseProjection * ndc;
#endif
  // posEC = posEC * (1.0 / posEC.w);
  posEC = posEC / posEC.w;
  return posEC.xyz;
}

void main() {
  vec2 UV = gl_FragCoord.xy * uBufferSizeAndInv.zw;
  // vec2 UV = vUV;
#if 1
  float d = texture2D(uDepthTexture, UV).r;
  gl_FragColor = vec4(d, d, d, 1);
  // gl_FragColor = vec4(8159890.9);
  return;
#endif

#if 1
  float DeviceZ = readDepth(uDepthTexture, UV);

// gl_FragColor = uInverseProjection[3];// texture2D(uDepthTexture, UV);
// return;

  if (DeviceZ >= 0.9999999) {
  // if (DeviceZ >= 1.0) {
    gl_FragColor = vec4(1, 0, 1, 1);
    return;
  }
  // if (DeviceZ == 0.0) {
  //   gl_FragColor = vec4(1, 0, 0, 1);
  //   return;
  // }
  // if (DeviceZ == 1.0) {
  //   gl_FragColor = vec4(0, 1, 0, 1);
  //   return;
  // }
  vec3 shadingPointEC = (clipToEye(UV, DeviceZ));
  #define M_TO_KM 0.001
  shadingPointEC = shadingPointEC;
  float t = (length(shadingPointEC)) / 96000.0;
  // 写入的是 0.65404，存的是 0.69412!!!
  gl_FragColor = vec4(vec3(t), 1.0);
  // gl_FragColor = vec4(vec3(0.8602), 1.0);
  return;
#else

#if 1
  gl_FragColor = texture2D(uColorTexture, UV);
#else
  float depth = texture2D(uDepthTexture, UV).r;
  vec4 ndc = vec4(vec3(UV, depth) * 2.0 - 1.0, 1.0);
  vec4 posEC = uInverseProjection * ndc;
  posEC = posEC / posEC.w;

  float near = uCurrentFrustum.x;
  float far = uCurrentFrustum.y;
  float t = (length(posEC) - near) / uCurrentFrustum.z ;

  gl_FragColor = vec4(t, t, t, 1);
#endif


#endif
}