varying vec3 vNormal;
varying vec3 vPositionEC;

uniform float uTime;
uniform float uBehind;

void main() {
  gl_FragColor.rgb = vec3(sin(uTime) * 0.5 + 0.5);
  gl_FragColor.rgb = vNormal * 0.5 + 0.5;
  // gl_FragColor.rgb = vec3(gl_FragCoord.z);
  float t = length(vPositionEC) / 10000000.0;
  // gl_FragColor.rgb = vec3(t);
  gl_FragColor.a = 1.0;

  vec3 normal = normalize(vNormal);
  if (uBehind == 1.0) {
    // gl_FragDepthEXT = -19.018018018018015;
    // FIXME: 设置了深度测试就不通过？？？
    // gl_FragDepthEXT = gl_FragCoord.z;// 0.0;
    // gl_FragColor.rgb = vec3(dot(normal, normalize(vec3(1, 1, 1))));
    // gl_FragColor.rgb = normal * 0.5 + 0.5;
    // gl_FragColor.rgb = vec3(0, 0, 1);
    // gl_FragDepthEXT = -1.0;
    // gl_FragDepthEXT = 0.9999999;
    // gl_FragDepthEXT = gl_FragCoord.z;
  } else {
    // gl_FragDepthEXT = gl_FragCoord.z;
  }

  writeLogDepth();
}