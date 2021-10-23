precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;

uniform float u_delta;
uniform float u_sigma;
uniform float u_direction;

varying vec2 v_uv;

#define SAMPLES 8

float gaussianPdf( in float x, in float sigma ) {
  return 0.39894 * exp( -0.5 * x * x / ( sigma * sigma ) ) / sigma;
}

void main() {
  vec2 dir = vec2(1.0 - u_direction, u_direction);
  vec2 inverseSize = 1.0 / u_resolution;
  float weightSum = gaussianPdf(0.0, u_sigma);
  vec3 colorSum = texture2D(u_texture, v_uv).rgb * weightSum;

  for (int i = 1; i < SAMPLES; i++) {
    float x = float(i);
    float weight = gaussianPdf(x, u_sigma);
    vec2 uvOffset = inverseSize * x * dir;
    vec3 sample1 = texture2D(u_texture, v_uv + uvOffset).rgb;
    vec3 sample2 = texture2D(u_texture, v_uv - uvOffset).rgb;

    colorSum += (sample1 + sample2) * weight;
    weightSum += 2.0 * weight;
  }
  gl_FragColor = vec4(colorSum / weightSum, 1);
}