varying float depthPlusOne;

void writeVertLogDepthOutput() {
  depthPlusOne = gl_Position.w + 1.0;
}
