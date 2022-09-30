precision highp float;

varying vec2 uv;
uniform sampler2D uColorTexture;
uniform sampler2D uBloomTexture;
// uniform sampler2D ColorGradingLUT;
uniform sampler2D uDistantSkyLightLutTexture;
uniform float uAutoExposureBias;

uniform vec4 uColorScale0;
uniform vec4 uColorScale1;

uniform float uTimeOfDay;


vec3 jodieReinhardTonemap(vec3 c) {
  // From: https://www.shadertoy.com/view/tdSXzD
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 tc = c / (c + 1.0);
  return mix(c / (l + 1.0), tc, tc);
}

vec3 ACESFilm(vec3 x)
{
  float a = 2.51;
  float b = 0.03;
  float c = 2.43;
  float d = 0.59;
  float e = 0.14;
  return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0., 1.);
}

float Luminance(vec3 LinearColor) {
  return dot( LinearColor, vec3( 0.3, 0.59, 0.11 ) );
}

void main() {
  const float OneOverPreExposure = 1.0;

  // 场景亮度
  vec4 sceneColor = texture2D(uColorTexture, uv);
  sceneColor.rgb *= OneOverPreExposure;

  // float ExposureScale = ExposureScaleVignette.x;
  // TODO: 没有自动曝光，根据时间设定曝光值？
  vec3 distantSkyLight = texture2D(uDistantSkyLightLutTexture, vec2(0.5)).rgb;
  float distantSkyLightLuminance = Luminance(distantSkyLight); // [0, ]

  // distantSkyLight 是全方位的采样，非当前视口的
  float targetAverageLuminance = clamp(distantSkyLightLuminance, 0.03*0.18, 8.0*0.18);
  float targetExposure = targetAverageLuminance / 0.18;

// TODO: 查看 UE 的默认值
// EyeAdaptation_ExposureCompensationSettings = pow(2, Auto Exposure Bias) 
// EyeAdaptation_ExposureCompensationCurve = pow(2, AutoExposureBiasCurve->GetFloatValue(LuminanceEV100)) 
// const float MiddleGreyExposureCompensation = EyeAdaptation_ExposureCompensationSettings * EyeAdaptation_ExposureCompensationCurve; // we want the average luminance remapped to 0.18, not 1.0
  float EyeAdaptation_ExposureCompensationCurve = pow(2.0, -1.0);
  float middleGreyExposureCompensation = pow(2.0, uAutoExposureBias) * EyeAdaptation_ExposureCompensationCurve;

  // float oldExposure = ???
  float estimatedExposure = targetExposure;

  float smoothedExposure = clamp(estimatedExposure, 0.03, 8.0);
  float smoothedExposureScale = 1.0 / max(0.0001, estimatedExposure);

  // float ExposureScale = 1.0 / pow(2.0, -1.1);
  float exposureScale = middleGreyExposureCompensation * smoothedExposureScale;
  // exposureScale = 1.0;
  // ExposureScale = 1.0 / distantSkyLightLuminance;
  // gl_FragColor = vec4(distantSkyLight, 1);return;
  // gl_FragColor = vec4(vec3(distantSkyLightLuminance), 1);return;

  vec3 linearColor = sceneColor.rgb * uColorScale0.rgb;

  // 加上 bloom
  vec4 combinedBloom = texture2D(uBloomTexture, uv);
  // gl_FragColor = combinedBloom;gl_FragColor.a = 1.; return;
  combinedBloom.rgb *= OneOverPreExposure;

  linearColor += combinedBloom.rgb * uColorScale1.rgb;

  // 乘上曝光
  linearColor *= exposureScale;

  vec3 outDeviceColor = ColorLookupTable( linearColor );
  // vec3 outDeviceColor = jodieReinhardTonemap( linearColor );
  // vec3 outDeviceColor = ACESFilm( linearColor );

  float LuminanceForPostProcessAA  = dot(outDeviceColor, vec3(0.299, 0.587, 0.114));

  vec4 outColor = vec4(outDeviceColor, clamp(LuminanceForPostProcessAA, 0.0, 1.0));

  outColor.a = sceneColor.a;

  gl_FragColor = outColor;
  // gl_FragColor.rgb = vec3(distantSkyLightLuminance);
  // gl_FragColor.rgb = distantSkyLight;
  // gl_FragColor.rgb = distantSkyLight;
  // gl_FragColor.rgb = sceneColor.rgb;
  // gl_FragColor.rgb = combinedBloom.rgb * uColorScale1.rgb * exposureScale;
}