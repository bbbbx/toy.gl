#extension GL_EXT_frag_depth : enable

#if GL_ES
  #if GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #elif
    precision mediump float;
  #endif
#endif

varying float depthPlusOne;
uniform float uOneOverLog2FarPlusOne;

#define gl_FragDepth gl_FragDepthEXT

void writeFragLogDepth() {
  gl_FragDepth = log2(max(1e-6, depthPlusOne)) * uOneOverLog2FarPlusOne;
}
