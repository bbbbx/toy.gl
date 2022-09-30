precision highp float;

uniform sampler2D InputTexture;
uniform float eyeAdaptation;
uniform float BloomThreshold;

varying float InExposureScale;
varying vec2 uv;

float Luminance(vec3 LinearColor) {
  return dot( LinearColor, vec3( 0.3, 0.59, 0.11 ) );
}

vec4 BloomSetupCommon(vec2 UV, float ExposureScale) {
  float OneOverPreExposure = 1.0;
  float PreExposure = 1.0;

  vec4 SceneColor = texture2D(InputTexture, UV) * OneOverPreExposure;

  // clamp to avoid artifacts from exceeding fp16 through framebuffer blending of multiple very bright lights
  SceneColor.rgb = min(vec3(256 * 256, 256 * 256, 256 * 256), SceneColor.rgb);

  vec3 LinearColor = SceneColor.rgb;

  // 从RGB计算亮度
	float TotalLuminance = Luminance(LinearColor) * ExposureScale;
	float BloomLuminance = TotalLuminance - BloomThreshold;
	float BloomAmount = clamp(BloomLuminance * 0.5, 0.0, 1.0);

  return vec4(BloomAmount * LinearColor, 0) * PreExposure;
}

void main() {
  vec2 UV = uv;

  float InExposureScale = eyeAdaptation;
  gl_FragColor = BloomSetupCommon(UV, InExposureScale);
}