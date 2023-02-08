varying float vDepthFromNearPlusOne;
uniform float uFarDepthFromNearPlusOne;
uniform float uOneOverLog2FarDepthFromNearPlusOne;

void writeLogDepth(float depthFromNearPlusOne)
{
  if (depthFromNearPlusOne <= 0.9999999 || depthFromNearPlusOne > uFarDepthFromNearPlusOne)
  {
    gl_FragColor = vec4(0, 1, 1, 1);
    gl_FragDepthEXT = gl_FragCoord.z;
    // return;
    discard;
  }

  gl_FragDepthEXT = log2(depthFromNearPlusOne) * uOneOverLog2FarDepthFromNearPlusOne;
}

void writeLogDepth()
{
  writeLogDepth(vDepthFromNearPlusOne);
}
