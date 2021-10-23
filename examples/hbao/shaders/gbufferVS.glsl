precision highp float;

attribute vec3 a_position;
attribute vec2 a_uv;
attribute vec3 a_normal;

uniform mat4 u_projectionMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_modelMatrix;
uniform mat3 u_normalMatrix;

varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_positionEC;

void main() {
  mat4 mvp = u_projectionMatrix * u_viewMatrix * u_modelMatrix;
  gl_Position = mvp * vec4(a_position, 1);
  v_uv = a_uv;
  v_normal = (u_viewMatrix * vec4(u_normalMatrix * a_normal, 0.0)).xyz;
  v_positionEC = (u_viewMatrix * u_modelMatrix * vec4(a_position, 1)).xyz;
}