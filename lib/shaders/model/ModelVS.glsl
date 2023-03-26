void main()
{
  // Initialize the attributes struct with vertex attributes.
  ProcessedAttributes attributes;
  initializeAttributes(attributes);

#ifdef HAS_SKINNING
  // TODO:
  // skinningStage(attributes);
#endif

  // Compute the bitangent according to the formula in the glTF spec.
  // Normal and tangents can be affected by morphing and skinning, so
  // the bitangent should not be computed until their values are finalized.
#ifdef HAS_BITANGENTS
  attributes.bitangentMC = normalize(cross(attributes.normalMC, attributes.tangentMC) * attributes.tangentSignMC );
#endif

#ifdef HAS_INSTANCING
  // TODO:
  // instancingStage(attributes);
#endif

  gl_Position = geometryStage(
    attributes,
    toy_modelMatrix,
    toy_modelViewMatrix,
    toy_projectionMatrix,
    toy_normalMatrix
  );
}
