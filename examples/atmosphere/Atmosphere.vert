attribute vec3 a_position;

varying vec3 viewRay;

uniform mat4 uView;
uniform mat4 uProjection;
uniform vec3 uEyePos;

void main() {
  vec3 pos = a_position;
  gl_Position = uProjection * uView * vec4(pos, 1);
  viewRay = pos - uEyePos;
}