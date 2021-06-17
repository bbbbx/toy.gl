precision highp float;

attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec3 a_normal;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
// TODO: transpose(inverse(worldMatrix))
uniform mat4 u_normalMatrix;

varying vec3 v_positionWC;
varying vec2 v_uv;
varying vec3 v_normalWC;

void main() {
  mat4 mvp = u_projectionMatrix * u_viewMatrix * u_modelMatrix;
  gl_Position = mvp * vec4(a_position, 1);
  v_positionWC = (u_modelMatrix * vec4(a_position, 1.0)).xyz;
//   v_positionWC = a_position;
  v_uv = a_uv;
  v_normalWC = normalize(vec3(u_normalMatrix * vec4(a_normal, 0.0)));
//   v_normalWC = normalize(a_normal);
}