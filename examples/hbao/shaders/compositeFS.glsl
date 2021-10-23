precision highp float;

uniform sampler2D u_blurTexture;
uniform sampler2D u_diffuseTexture;
uniform sampler2D u_hbaoTexture;
uniform sampler2D u_depthTexture;
uniform sampler2D u_normalTexture;
uniform mat4 u_inverseProjectionMatrix;
uniform vec2 u_nearFar;

varying vec2 v_uv;

#define OUTPUT_WITH_SSAO 0
#define OUTPUT_WITHOUT_SSAO 1
#define OUTPUT_ONLY_SSAO 2
#define OUTPUT_SSAO_BLUR 3
#define OUTPUT_DEPTH 4
#define OUTPUT_NORMAL 5

void main() {
  vec3 ao = texture2D(u_blurTexture, v_uv).rgb;
  vec3 diffuse = texture2D(u_diffuseTexture, v_uv).rgb;

  gl_FragColor = vec4(pow(diffuse, vec3(1.0/2.2)), 1);

  #if OUTPUT == OUTPUT_WITH_SSAO
    gl_FragColor.rgb *= ao;
  #endif

  #if OUTPUT == OUTPUT_ONLY_SSAO
    gl_FragColor.rgb = texture2D(u_hbaoTexture, v_uv).rgb;
  #endif

  #if OUTPUT == OUTPUT_SSAO_BLUR
    gl_FragColor.rgb = ao;
  #endif

  #if OUTPUT == OUTPUT_DEPTH
    float depth = texture2D(u_depthTexture, v_uv).r;
    depth = depth * 2.0 - 1.0;

    vec4 view = u_inverseProjectionMatrix * vec4(0, 0, depth, 1);
    vec3 view3 = view.xyz / view.w;
    float near = u_nearFar.x;
    float far = u_nearFar.y;
    gl_FragColor.rgb = vec3((-view3.z - near) / (far - near));
  #endif

  #if OUTPUT == OUTPUT_NORMAL
    gl_FragColor.rgb = texture2D(u_normalTexture, v_uv).rgb;
  #endif
}
