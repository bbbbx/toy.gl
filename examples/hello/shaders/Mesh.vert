attribute vec3 aPosition;
attribute vec3 aNormal;

uniform float uTime;
uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProjection;
uniform mat4 uModelView;
uniform mat4 uModelViewProjection;
uniform float uBehind;

varying vec3 vNormal;
varying vec3 vPositionEC;

void main() {
  vec4 position = vec4(aPosition, 1);
  // gl_Position = position;
  // gl_Position.xyz = mat3(
  //   cos(uTime), -sin(uTime), 0.0,
  //   sin(uTime), cos(uTime), 0.0,
  //   0.0,        0.0,        1.0
  // ) * gl_Position.xyz;

  vNormal = normalize(uModel * vec4(aNormal, 0)).xyz;
  // vNormal = normalize(gl_Position.xyz);

  vec3 positionEC = (uModelView * position).xyz;
  vPositionEC = positionEC;
  // gl_Position = uProjection * positionEC;
  gl_Position = uModelViewProjection * vec4(aPosition, 1);

  if (bool(uBehind)) {
    // gl_Position.z = -19.018018018018015;
    // gl_Position.z = (gl_Position.w) * sign(gl_Position.w);
  }
  // gl_Position = vec4(
  //   0.0,
  //   0.0,
  //   0.0,//-19.018018018018015,
  //   1.0);

  vertexLogDepth();
}