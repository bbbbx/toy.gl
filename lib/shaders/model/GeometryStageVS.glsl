vec4 geometryStage(
  inout ProcessedAttributes attributes,
  mat4 modelMatrix,
  mat4 modelViewMatrix,
  mat4 projectionMatrix,
  mat3 normalMatrix
) {
  vec3 positionMC = attributes.positionMC;
  v_positionMC = positionMC;
  v_positionEC = (modelViewMatrix * vec4(positionMC, 1.0)).xyz;

  vec4 computedPosition = projectionMatrix * vec4(v_positionEC, 1.0);

  v_positionWC = (modelMatrix * vec4(positionMC, 1.0)).xyz;

#ifdef HAS_NORMALS
  v_normalEC = normalize(normalMatrix * attributes.normalMC);
#endif

#ifdef HAS_TANGENTS
  vec3 tangentMC = a_tangentMC.xyz;
  v_tangentEC = normalize(normalMatrix * attributes.tangentMC);
#endif

#ifdef HAS_BITANGENTS
  v_bitangentEC = normalize(normalMatrix * attributes.bitangentMC);
#endif

  // All other varyings need to be dynamically generated in
  // GeometryPipelineStage
  setDynamicVaryings(attributes);

  return computedPosition;
}
