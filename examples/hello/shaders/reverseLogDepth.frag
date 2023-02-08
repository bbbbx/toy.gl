uniform vec4 uCurrentFrustum;
uniform float uLog2FarDepthFromNearPlusOne;

float reverseLogDepth(float logZ)
{
  float near = uCurrentFrustum.x;
  float far = uCurrentFrustum.y;
  float log2Depth = logZ * uLog2FarDepthFromNearPlusOne;
  float depthFromNear = pow(2.0, log2Depth) - 1.0;
  // near / (depthFromNear + near) 会很小
  // 1.24737E-06
  // 1.0 - near / (depthFromNear + near) 会变成 1.00
  // (far - near) 的结果还是 far!!!
  // return far * (1.0 - near / (depthFromNear + near)) / uCurrentFrustum.z;// (far - near);
  return uCurrentFrustum.w * (1.0 - near / (depthFromNear + near));
}
