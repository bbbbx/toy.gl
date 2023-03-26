// Assume normalized input. Output is on [-1, 1] for each component.
vec2 toy_UnitVectorToOctahedron(vec3 N)
{
  // Project the sphere onto the octahedron, and then onto the xy plane
  N.xy /= dot( vec3(1.0), abs(N) );
  // Reflect the folds of the lower hemisphere over the diagonals
  if ( N.z <= 0.0 )
  {
    N.xy = ( 1.0 - abs(N.yx) ) * vec2( N.x >= 0.0 ? 1.0 : -1.0, N.y >= 0.0 ? 1.0 : -1.0 );
  }

  return N.xy;
}
