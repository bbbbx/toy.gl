attribute vec2 aPosition;
attribute vec2 aUv;

uniform mat4 uView;
uniform mat4 uProjection;
uniform float uGroundRadiusMM;
uniform sampler2D uHeightMap;

varying vec2 vUv;
varying float vHeight;
varying vec3 vPosition;

void main() {
  vec4 position = vec4(aPosition.xy, uGroundRadiusMM-0.001, 1);
  position.x -= 0.025;
  position.y -= 0.025;
  position.xyz *= 1e6;
  float height = texture2DLod(uHeightMap, vec2(aUv.x, aUv.y), 0.0).r;
  float scaleHeight = height * 0.005 * 1e6;
  position.z += scaleHeight;
  gl_Position = uProjection * uView * position;

  vUv = aUv;
  vHeight = height;
  vPosition = vec3(aPosition.xy, scaleHeight);


  writeVertLogDepthOutput();
}