varying float vDepthFromNearPlusOne;
uniform vec4 uCurrentFrustum;

vec4 updatePositionDepth(vec4 clipPosition)
{
  if (uCurrentFrustum.x == 0.1) {
    return clipPosition;
  }
  if (clipPosition.w >= uCurrentFrustum.x) {
    clipPosition.z = clipPosition.w;
  } else {
    // 1 * (负数)
    clipPosition.z = clamp(clipPosition.z / clipPosition.w, 0.0, 1.0) * clipPosition.w;
  }
  return clipPosition;
}

void vertexLogDepth()
{
  vDepthFromNearPlusOne = (gl_Position.w - uCurrentFrustum.x) + 1.0;
  gl_Position = updatePositionDepth(gl_Position);
}
