attribute vec2 a_position;
varying vec2 uv;

void main() {
  gl_Position = vec4(a_position, 0, 1);
  uv = a_position * 0.5 + 0.5;
}