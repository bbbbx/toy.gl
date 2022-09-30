
// SkyViewLut is a new texture used for fast sky rendering.
// It is low resolution of the sky rendering around the camera,
// basically a lat/long parameterisation with more texel close to the horizon for more accuracy during sun set.

void UvToSkyViewLutParams(out float3 ViewDir, in float ViewHeight, in float2 UV)
{
	// Constrain uvs to valid sub texel range (avoid zenith derivative issue making LUT usage visible)
	UV = FromSubUvsToUnit(UV, SkyAtmosphere.SkyViewLutSizeAndInvSize);

	float Vhorizon = sqrt(ViewHeight * ViewHeight - Atmosphere.BottomRadiusKm * Atmosphere.BottomRadiusKm);
	float CosBeta = Vhorizon / ViewHeight;				// cos of zenith angle from horizon to zeniht
	float Beta = acosFast4(CosBeta);
	float ZenithHorizonAngle = PI - Beta;

	float ViewZenithAngle;
	if (UV.y < 0.5)
	{
		float Coord = 2.0 * UV.y;
		Coord = 1.0 - Coord;
		Coord *= Coord;
		Coord = 1.0 - Coord;
		ViewZenithAngle = ZenithHorizonAngle * Coord;
	}
	else
	{
		float Coord = UV.y * 2.0 - 1.0;
		Coord *= Coord;
		ViewZenithAngle = ZenithHorizonAngle + Beta * Coord;
	}
	float CosViewZenithAngle = cos(ViewZenithAngle);
	float SinViewZenithAngle = sqrt(1.0 - CosViewZenithAngle * CosViewZenithAngle) * (ViewZenithAngle > 0.0 ? 1.0 : -1.0); // Equivalent to sin(ViewZenithAngle)

	float LongitudeViewCosAngle = UV.x * 2.0 * PI;

	// Make sure those values are in range as it could disrupt other math done later such as sqrt(1.0-c*c)
	float CosLongitudeViewCosAngle = cos(LongitudeViewCosAngle);
	float SinLongitudeViewCosAngle = sqrt(1.0 - CosLongitudeViewCosAngle * CosLongitudeViewCosAngle) * (LongitudeViewCosAngle <= PI ? 1.0 : -1.0); // Equivalent to sin(LongitudeViewCosAngle)
	ViewDir = float3(
		SinViewZenithAngle * CosLongitudeViewCosAngle,
		SinViewZenithAngle * SinLongitudeViewCosAngle,
		CosViewZenithAngle
		);
}

void RenderSkyViewLutCS()
{
  float2 PixPos = float2(gl_FragCoord.xy);
  float2 UV = PixPos * SkyAtmosphere.SkyViewLutSizeAndInvSize.zw;
  // FIXME:
  // UV.y = 1. - UV.y;

  float3 WorldPos = GetCameraPlanetPos();

  // For the sky view lut to work, and not be distorted, we need to transform the view and light directions 
  // into a referential with UP being perpendicular to the ground. And with origin at the planet center.

  // This is the local referencial
	float3x3 LocalReferencial = GetSkyViewLutReferential(WorldPos, View.ViewForward, View.ViewRight);

  // This is the LUT camera height and position in the local referential
	float ViewHeight = length(WorldPos);
	WorldPos = float3(0.0, 0.0, ViewHeight);

  // Get the view direction in this local referential
	float3 WorldDir;
	UvToSkyViewLutParams(WorldDir, ViewHeight, UV);
	// And also both light source direction
	float3 AtmosphereLightDirection0 = View.AtmosphereLightDirection[0].xyz;
	AtmosphereLightDirection0 = mul(AtmosphereLightDirection0, LocalReferencial);
	float3 AtmosphereLightDirection1 = View.AtmosphereLightDirection[1].xyz;
	AtmosphereLightDirection1 = mul(AtmosphereLightDirection1, LocalReferencial);

  // Move to top atmospehre
  if (!MoveToTopAtmosphere(WorldPos, WorldDir, Atmosphere.TopRadiusKm))
  {
    // Ray is not intersecting the atmosphere
    // SkyViewLutUAV[int2(PixPos)] = 0.0f;
    gl_FragColor = vec4(0, 0, 0, 1);
    return;
  }

  SamplingSetup Sampling;
	{
		Sampling.VariableSampleCount = false;
		Sampling.MinSampleCount = SkyAtmosphere.FastSkySampleCountMin;
		Sampling.MaxSampleCount = SkyAtmosphere.FastSkySampleCountMax;
		Sampling.DistanceToSampleCountMaxInv = SkyAtmosphere.FastSkyDistanceToSampleCountMaxInv;

		Sampling.SampleCountIni = SkyAtmosphere.FastSkySampleCountMax;
	}
	const bool Ground = false;
	const float DeviceZ = FarDepthValue;
	const bool MieRayPhase = true;
	const float AerialPespectiveViewDistanceScale = 1.0;
	SingleScatteringResult ss = IntegrateSingleScatteredLuminance(
		float4(PixPos, 0.0, 1.0), WorldPos, WorldDir,
		Ground, Sampling, DeviceZ, MieRayPhase,
		AtmosphereLightDirection0, AtmosphereLightDirection1, View.AtmosphereLightColor[0].rgb, View.AtmosphereLightColor[1].rgb,
		AerialPespectiveViewDistanceScale);

  gl_FragColor = vec4(ss.L + 0.1, 1);
}