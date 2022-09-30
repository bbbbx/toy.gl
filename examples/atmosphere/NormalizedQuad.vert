attribute vec2 a_position;
varying vec2 uv;
varying vec4 ndc;

#ifndef StartDepthZ
#define StartDepthZ 0
#endif

void main() {
  gl_Position = vec4(a_position, StartDepthZ, 1);
  uv = a_position * 0.5 + 0.5;
  ndc = gl_Position / gl_Position.w;
}