attribute vec2 aPosition;
varying vec2 vUV;

void main() {
  gl_Position = vec4(aPosition, 0, 1);

  vUV = aPosition * 0.5 + 0.5;
}