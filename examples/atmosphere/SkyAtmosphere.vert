// attribute vec3 a_position;

// varying vec3 viewRay;

// uniform mat4 uView;
// uniform mat4 uProjection;
// uniform vec3 uViewPos;
// uniform mat3 uSkyViewLutReferential;

// void main() {
//   vec3 worldPos = a_position;
//   gl_Position = uProjection * uView * vec4(worldPos, 1);
//   viewRay = uSkyViewLutReferential * (worldPos - uViewPos);
// }

attribute vec2 a_position;
varying vec2 uv;
varying vec4 ndc;

#ifndef StartDepthZ
#define StartDepthZ 0
#endif

void main() {
  gl_Position = vec4(a_position, 0.1, 1);
  uv = a_position * 0.5 + 0.5;
  ndc = gl_Position / gl_Position.w;
}