precision highp float;

uniform sampler2D u_depthTexture;
uniform sampler2D u_positionTexture;
uniform sampler2D u_normalTexture;
uniform sampler2D u_diffuseTexture;
uniform sampler2D u_randomTexture;
uniform mat4 u_inverseView;
uniform mat4 u_inverseProjectionMatrix;
uniform vec2 u_resolution;
uniform float u_pixelRatio;

uniform float u_lengthGap;
uniform float u_bias;
uniform float u_stepSize;
uniform float u_intensity;

#define PI_OVER_TWO 1.5707963267948966

varying vec2 v_uv;

void main() {
  vec2 pixelSize = 1. / u_resolution;

  float depth = texture2D(u_depthTexture, v_uv).r;
  vec3 diffuse = texture2D(u_diffuseTexture, v_uv).rgb;
  vec3 normal = normalize(texture2D(u_normalTexture, v_uv).rgb);
  vec3 position = texture2D(u_positionTexture, v_uv).rgb;
  float randomValue = texture2D(u_randomTexture, v_uv).r;

  float gapAngle = PI_OVER_TWO;

  float ao = 0.0;

  for (int i = 0; i < 4; i++) {
    float angle = gapAngle * (float(i) + randomValue);
    float cosOfAngle = cos(angle);
    float sinOfAngle = sin(angle);

    vec2 rotatedDirection = vec2(cosOfAngle, sinOfAngle);
    float localAO = 0.0;
    float localStepSize = u_stepSize;

    for (int j = 0; j < 6; j++) {
      vec2 newUV = v_uv + rotatedDirection * localStepSize * pixelSize;

      if (newUV.x > 1.0 || newUV.x < 0.0 || newUV.y > 1.0 || newUV.y < 0.0) {
        break;
      }

      float sampleDepth = texture2D(u_depthTexture, newUV).r;
      vec3 samplePosition = texture2D(u_positionTexture, newUV).xyz;
      vec3 sampleDir = samplePosition - position;
      float len = length(sampleDir);

      if (len > u_lengthGap) {
        break;
      }

      float NdotSampleDir = clamp(dot(normal, normalize(sampleDir)), 0.0, 1.0);
      float weight = len / u_lengthGap;
      weight = 1.0 - weight * weight;

      if (NdotSampleDir < u_bias) {
        NdotSampleDir = 0.0;
      }

      localAO = max(localAO, NdotSampleDir * weight);
      localStepSize += u_stepSize;
    }
    ao += localAO;
  }

  ao /= 4.0;
  ao = 1.0 - clamp(ao, 0.0, 1.0);
  ao = pow(ao, u_intensity);
  gl_FragColor = vec4(vec3(ao), 1.0);
}