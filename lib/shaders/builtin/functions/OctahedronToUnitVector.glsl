vec3 toy_OctahedronToUnitVector( vec2 Oct )
{
  vec3 N = vec3( Oct, 1.0 - dot( vec2(1.0), abs(Oct) ) );
  float t = max( -N.z, 0.0 );
#if __VERSION__ == 300
  N.xy += mix( vec2(t), vec2(-t), greaterThanEqual( N.xy, vec2(0.0) ) );
#else
  N.xy += mix( vec2(t), vec2(-t), vec2(greaterThanEqual( N.xy, vec2(0.0) )) );
#endif
  return normalize(N);
}
