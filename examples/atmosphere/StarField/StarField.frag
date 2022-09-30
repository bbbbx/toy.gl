varying float luminance;

void main() {
  gl_FragColor = vec4(luminance, luminance, luminance, 1.0);
  // gl_FragColor = vec4(1.0);

  writeFragLogDepth();
}