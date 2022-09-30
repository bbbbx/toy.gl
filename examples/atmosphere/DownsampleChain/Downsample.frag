precision highp float;

varying vec2 vUV;

// uniform sampler2D sceneColor;
uniform sampler2D InputTexture;
uniform vec2 Input_ExtentInverse;
uniform vec2 Input_UVViewportBilinearMin;
uniform vec2 Input_UVViewportBilinearMax;
uniform vec2 Output_ExtentInverse;

vec4 SampleInput(vec2 UV) {
  UV = clamp(UV, Input_UVViewportBilinearMin, Input_UVViewportBilinearMax);

  return texture2D(InputTexture, UV);
}

vec4 DownsampleCommon(vec2 UV) {
  vec4 OutColor;

  // Output: float4(RGBA), 4 filtered samples
  vec2 UVs[4];

  // Blur during downsample (4x4 kernel) to get better quality especially for HDR content.
  UVs[0] = UV + Input_ExtentInverse * vec2(-1, -1);
  UVs[1] = UV + Input_ExtentInverse * vec2( 1, -1);
  UVs[2] = UV + Input_ExtentInverse * vec2(-1,  1);
  UVs[3] = UV + Input_ExtentInverse * vec2( 1,  1);

  vec4 Sample[4];
  for(int i = 0; i < 4; ++i)
  {
    Sample[i] = SampleInput(UVs[i]);
  }

  OutColor = (Sample[0] + Sample[1] + Sample[2] + Sample[3]) * 0.25;

  return OutColor;
}

void main() {
  vec2 UV = gl_FragCoord.xy * Output_ExtentInverse;
  // gl_FragColor = texture2D(sceneColor, UV);
  gl_FragColor = DownsampleCommon(UV);
  // gl_FragColor = vec4(UV, 0, 1);
}
