precision highp float;
#extension GL_OES_standard_derivatives: enable

varying vec2 vUv;
varying float vHeight;
varying vec3 vPosition;

uniform vec3 uAtmosphereLightDirection0;
uniform vec3 uAtmosphereLightDirection1;
uniform vec4 uAtmosphereLightColor0;
uniform vec4 uAtmosphereLightColor1;
uniform sampler2D uGroundDiffuseMap;


void main() {
  gl_FragColor = vec4(vHeight, vHeight, vHeight, 1);

  vec3 normal = normalize(cross(dFdx(vPosition), dFdy(vPosition)));
  gl_FragColor.rgb = normal;
  gl_FragColor.rgb = texture2D(uGroundDiffuseMap, vUv).rgb;
  // gl_FragColor.rgb = vPosition * 10.0;

  float L0oN = clamp(dot(uAtmosphereLightDirection0, normal), 0.0, 1.0);
  float L1oN = clamp(dot(uAtmosphereLightDirection1, normal), 0.0, 1.0);

  // gl_FragColor.rgb =L1oN * uAtmosphereLightColor1.rgb;
  // gl_FragColor.rgb = vec3(1);

  writeFragLogDepth();
}