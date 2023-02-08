float readDepth(sampler2D depthTexture, vec2 UV)
{
  float logDepth = texture2D(depthTexture, UV).r;
  return reverseLogDepth(logDepth);
}
