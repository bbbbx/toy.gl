attribute vec2 position;
attribute float instanceId;

uniform sampler2D uParamsSampler;
uniform float uBrightness;
uniform vec2 uInvWindowSize;
uniform float uStarCount;
uniform float uLuminanceReference;


uniform float uFar;
uniform mat3 uTemeToPseudoFixed;
uniform mat3 uViewRotation;
uniform mat4 uProjectionMatrix;

uniform float uStarScale;
const float lowestVisibleMagnitude = 0.0;

varying float luminance;

// #define WEBGL_2 0

void main() {
#ifdef WEBGL_2
  vec4 params = texelFetch(uParamsSampler, ivec2(gl_InstanceID, 0), 0);
#else
  // Stored in instanced attribute?
  vec4 params = texture2DLod(uParamsSampler, vec2((instanceId + float(0.5)) / uStarCount, 0.5), 0.0);
#endif
  vec3 worldPosition = (uFar * params.xyz);
  vec3 viewPosition = uViewRotation * (uTemeToPseudoFixed * worldPosition);
  gl_Position = uProjectionMatrix * vec4(viewPosition, 1);
  gl_Position.xy += (position.xy * uStarScale * uInvWindowSize) * gl_Position.w;

  float magnitude = params.w;
  luminance = pow(10.0, (magnitude - lowestVisibleMagnitude) / -2.5);
  luminance *= uBrightness * uLuminanceReference;

  writeVertLogDepthOutput();
}