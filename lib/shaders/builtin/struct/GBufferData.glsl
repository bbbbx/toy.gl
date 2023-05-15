struct toy_GBufferData
{
  // normalized
	vec3 WorldNormal;
	// normalized, only valid if HAS_ANISOTROPY_MASK in SelectiveOutputMask
	vec3 WorldTangent;
  // 0..1 (derived from BaseColor, Metalness, Specular)
	vec3 DiffuseColor;
	// 0..1 (derived from BaseColor, Metalness, Specular)
	vec3 SpecularColor;
	// 0..1, white for SHADINGMODELID_SUBSURFACE_PROFILE and SHADINGMODELID_EYE (apply BaseColor after scattering is more correct and less blurry)
	vec3 BaseColor;
  // 0..1
  float Metallic;
  // 0..1
  float Specular;
  // 0..1
  float Roughness;
  // 0..1
  vec4 CustomData;
  // AO utility value
  float GenericAO;
  // -1..1, only valid if only valid if HAS_ANISOTROPY_MASK in SelectiveOutputMask
  float Anisotropy;
  // 0..1 ambient occlusion  e.g.SSAO, wet surface mask, skylight mask, ...
  float GBufferAO;
  uint ShadingModelID;
  uint SelectiveOutputMask;
  // in world units
  float CustomDepth;
  // Custom depth stencil value
	uint CustomStencil;
  // in unreal units (linear), can be used to reconstruct world position,
	// only valid when decoding the GBuffer as the value gets reconstructed from the Z buffer
	float Depth;
	// Velocity for motion blur (only used when WRITES_VELOCITY_TO_GBUFFER is enabled)
	vec4 Velocity;
};
