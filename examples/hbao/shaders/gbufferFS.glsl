#extension GL_EXT_draw_buffers: require
precision highp float;
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_positionEC;

uniform vec3 u_diffuse;
uniform sampler2D u_diffuseMap;

void main() {
  vec3 N = normalize(v_normal);
  vec2 uv = abs(fract(v_uv));
  // 纹理坐标原点位于左下角
  uv.y = 1.0 - uv.y;

  gl_FragData[0] = vec4(v_positionEC, 1);
  gl_FragData[1] = vec4(N, 1);
  gl_FragData[2] = texture2D(u_diffuseMap, uv) * vec4(u_diffuse, 1);
}
