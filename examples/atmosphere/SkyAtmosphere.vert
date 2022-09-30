attribute vec3 a_position;

varying vec3 viewRay;

uniform mat4 uView;
uniform mat4 uProjection;
uniform vec3 uEyePos;
uniform mat3 uSkyViewLutReferential;

void main() {
  vec3 worldPos = a_position;
  gl_Position = uProjection * uView * vec4(worldPos, 1);
  viewRay = uSkyViewLutReferential * (worldPos - uEyePos);
}