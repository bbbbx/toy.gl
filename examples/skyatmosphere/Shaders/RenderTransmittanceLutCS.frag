
void RenderTransmittanceLutCS() {
  float2 PixPos = float2(gl_FragCoord.xy);

// FIXME: UV 不对
  float2 UV = (PixPos) * SkyAtmosphere.TransmittanceLutSizeAndInvSize.zw;
//   UV = vUV;

//   gl_FragColor = vec4(UV, 0, 1);return;
  float ViewHeight;
	float ViewZenithCosAngle;
	UvToLutTransmittanceParams(ViewHeight, ViewZenithCosAngle, UV);

  //  A few extra needed constants
	float3 WorldPos = float3(0.0, 0.0, ViewHeight);
	float3 WorldDir = float3(0.0, sqrt(1.0 - ViewZenithCosAngle * ViewZenithCosAngle), ViewZenithCosAngle);

  SamplingSetup Sampling;
	{
		Sampling.VariableSampleCount = false;
		Sampling.SampleCountIni = SkyAtmosphere.TransmittanceSampleCount;

		Sampling.MinSampleCount = 0.0;
		Sampling.MaxSampleCount = 0.0;
		Sampling.DistanceToSampleCountMaxInv = 0.0;
	}
  const bool Ground = false;
	const float DeviceZ = FarDepthValue;
	const bool MieRayPhase = false;
	const float3 NullLightDirection = float3(0.0, 0.0, 1.0);
	const float3 NullLightIlluminance = float3(0.0, 0.0, 0.0);
	const float AerialPespectiveViewDistanceScale = 1.0;
  SingleScatteringResult ss = IntegrateSingleScatteredLuminance(
		float4(PixPos,0.0,1.0), WorldPos, WorldDir,
		Ground, Sampling, DeviceZ, MieRayPhase,
		NullLightDirection, NullLightDirection, NullLightIlluminance, NullLightIlluminance,
		AerialPespectiveViewDistanceScale);

  float3 transmittance = exp(-ss.OpticalDepth);

  gl_FragColor = vec4(transmittance, 1);
//   gl_FragColor = vec4(vec3(Atmosphere.AbsorptionDensity0LinearTerm), 1);
  // gl_FragColor = vec4(UV, 0, 1);
}