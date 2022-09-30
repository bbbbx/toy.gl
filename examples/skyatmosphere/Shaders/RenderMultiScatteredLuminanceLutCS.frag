uniform vec4 UniformSphereSamplesBuffer[64];
// UniformSphereSamplesBufferSampleCount;

void RenderMultiScatteredLuminanceLutCS() {
    float2 PixPos = float2(gl_FragCoord.xy);

    float CosLightZenithAngle = (PixPos.x * SkyAtmosphere.MultiScatteredLuminanceLutSizeAndInvSize.z) * 2.0 - 1.0;
	float3 LightDir = float3(0.0, sqrt(saturate(1.0 - CosLightZenithAngle * CosLightZenithAngle)), CosLightZenithAngle);
	const float3 NullLightDirection = float3(0.0, 0.0, 1.0);
	const float3 NullLightIlluminance = float3(0.0, 0.0, 0.0);
	const float3 OneIlluminance = float3(1.0, 1.0, 1.0);  // Assume a pure white light illuminance for the LUT to act as a transfer (be independent of the light, only dependent on the earth)
	float ViewHeight = Atmosphere.BottomRadiusKm + (PixPos.y * SkyAtmosphere.MultiScatteredLuminanceLutSizeAndInvSize.w) * (Atmosphere.TopRadiusKm - Atmosphere.BottomRadiusKm);

    float3 WorldPos = float3(0.0, 0.0, ViewHeight);
	float3 WorldDir = float3(0.0, 0.0, 1.0);

	SamplingSetup Sampling;
	{
		Sampling.VariableSampleCount = false;
		Sampling.SampleCountIni = SkyAtmosphere.MultiScatteringSampleCount;

        Sampling.MinSampleCount = 0.0;
		Sampling.MaxSampleCount = 0.0;
		Sampling.DistanceToSampleCountMaxInv = 0.0;
	}
	const bool Ground = true;
	const float DeviceZ = FarDepthValue;
	const bool MieRayPhase = false;
	const float AerialPespectiveViewDistanceScale = 1.0;

	const float SphereSolidAngle = 4.0 * PI;
	const float IsotropicPhase = 1.0 / SphereSolidAngle;

#if HIGHQUALITY_MULTISCATTERING_APPROX_ENABLED

	float3 IntegratedIlluminance = float3(0.0);
	float3 MultiScatAs1 = float3(0.0);
	for (int s = 0; s < UniformSphereSamplesBufferSampleCount; ++s)
	{
		SingleScatteringResult r0 = IntegrateSingleScatteredLuminance(float4(PixPos, 0.0, 1.0), WorldPos, UniformSphereSamplesBuffer[s].xyz, Ground, Sampling, DeviceZ, MieRayPhase,
			LightDir, NullLightDirection, OneIlluminance, NullLightIlluminance, AerialPespectiveViewDistanceScale);

		IntegratedIlluminance += r0.L;
		MultiScatAs1 += r0.MultiScatAs1;
	}
	float InvCount = 1.0 / float(UniformSphereSamplesBufferSampleCount);
	IntegratedIlluminance *= SphereSolidAngle * InvCount;
	MultiScatAs1 *= InvCount;

	float3 InScatteredLuminance = IntegratedIlluminance * IsotropicPhase;

#elif 1

    // Cheap and good enough approximation (but lose energy) 
	SingleScatteringResult r0 = IntegrateSingleScatteredLuminance(float4(PixPos, 0.0, 1.0), WorldPos, WorldDir, Ground, Sampling, DeviceZ, MieRayPhase,
		LightDir, NullLightDirection, OneIlluminance, NullLightIlluminance, AerialPespectiveViewDistanceScale);
	SingleScatteringResult r1 = IntegrateSingleScatteredLuminance(float4(PixPos, 0.0, 1.0), WorldPos, -WorldDir, Ground, Sampling, DeviceZ, MieRayPhase,
		LightDir, NullLightDirection, OneIlluminance, NullLightIlluminance, AerialPespectiveViewDistanceScale);

	float3 IntegratedIlluminance = (SphereSolidAngle / 2.0) * (r0.L + r1.L);
	float3 MultiScatAs1 = (1.0 / 2.0)*(r0.MultiScatAs1 + r1.MultiScatAs1);
	float3 InScatteredLuminance = IntegratedIlluminance * IsotropicPhase;
#else

    // Less cheap but approximation closer to ground truth
    SingleScatteringResult r0 = IntegrateSingleScatteredLuminance(float4(PixPos, 0.0, 1.0), WorldPos, float3(0.70710678118, 0.0, 0.70710678118), Ground, Sampling, DeviceZ, MieRayPhase,
                                                                  LightDir, NullLightDirection, OneIlluminance, NullLightIlluminance, AerialPespectiveViewDistanceScale);
    SingleScatteringResult r1 = IntegrateSingleScatteredLuminance(float4(PixPos, 0.0, 1.0), WorldPos, float3(-0.70710678118, 0.0, 0.70710678118), Ground, Sampling, DeviceZ, MieRayPhase,
                                                                  LightDir, NullLightDirection, OneIlluminance, NullLightIlluminance, AerialPespectiveViewDistanceScale);
    SingleScatteringResult r2 = IntegrateSingleScatteredLuminance(float4(PixPos, 0.0, 1.0), WorldPos, float3(0.0, 0.70710678118, 0.70710678118), Ground, Sampling, DeviceZ, MieRayPhase,
                                                                  LightDir, NullLightDirection, OneIlluminance, NullLightIlluminance, AerialPespectiveViewDistanceScale);
    SingleScatteringResult r3 = IntegrateSingleScatteredLuminance(float4(PixPos, 0.0, 1.0), WorldPos, float3(0.0, -0.70710678118, 0.70710678118), Ground, Sampling, DeviceZ, MieRayPhase,
                                                                  LightDir, NullLightDirection, OneIlluminance, NullLightIlluminance, AerialPespectiveViewDistanceScale);
    SingleScatteringResult r4 = IntegrateSingleScatteredLuminance(float4(PixPos, 0.0, 1.0), WorldPos, float3(0.70710678118, 0.0, -0.70710678118), Ground, Sampling, DeviceZ, MieRayPhase,
                                                                  LightDir, NullLightDirection, OneIlluminance, NullLightIlluminance, AerialPespectiveViewDistanceScale);
    SingleScatteringResult r5 = IntegrateSingleScatteredLuminance(float4(PixPos, 0.0, 1.0), WorldPos, float3(-0.70710678118, 0.0, -0.70710678118), Ground, Sampling, DeviceZ, MieRayPhase,
                                                                  LightDir, NullLightDirection, OneIlluminance, NullLightIlluminance, AerialPespectiveViewDistanceScale);
    SingleScatteringResult r6 = IntegrateSingleScatteredLuminance(float4(PixPos, 0.0, 1.0), WorldPos, float3(0.0, 0.70710678118, -0.70710678118), Ground, Sampling, DeviceZ, MieRayPhase,
                                                                  LightDir, NullLightDirection, OneIlluminance, NullLightIlluminance, AerialPespectiveViewDistanceScale);
    SingleScatteringResult r7 = IntegrateSingleScatteredLuminance(float4(PixPos, 0.0, 1.0), WorldPos, float3(0.0, -0.70710678118, -0.70710678118), Ground, Sampling, DeviceZ, MieRayPhase,
                                                                  LightDir, NullLightDirection, OneIlluminance, NullLightIlluminance, AerialPespectiveViewDistanceScale);

    // Integral of in-scattered Luminance (Lumen/(m2.sr)) over the sphere gives illuminance (Lumen/m2).
    // This is done with equal importance for each samples over the sphere.
    float3 IntegratedIlluminance = (SphereSolidAngle / 8.0) * (r0.L + r1.L + r2.L + r3.L + r4.L + r5.L + r6.L + r7.L);

    // MultiScatAs1 represents the contribution of a uniform environment light over a sphere of luminance 1 and assuming an isotropic phase function
    float3 MultiScatAs1 = (1.0 / 8.0) * (r0.MultiScatAs1 + r1.MultiScatAs1 + r2.MultiScatAs1 + r3.MultiScatAs1 + r4.MultiScatAs1 + r5.MultiScatAs1 + r6.MultiScatAs1 + r7.MultiScatAs1);

    // Compute the InScatteredLuminance (Lumen/(m2.sr)) assuming a uniform IntegratedIlluminance, isotropic phase function (1.0/sr)
    // and the fact that this illumiance would be used for each path/raymarch samples of each path
    float3 InScatteredLuminance = IntegratedIlluminance * IsotropicPhase;

#endif

    // MultiScatAs1 represents the amount of luminance scattered as if the integral of scattered luminance over the sphere would be 1.
	//  - 1st order of scattering: one can ray-march a straight path as usual over the sphere. That is InScatteredLuminance.
	//  - 2nd order of scattering: the inscattered luminance is InScatteredLuminance at each of samples of fist order integration. Assuming a uniform phase function that is represented by MultiScatAs1,
	//  - 3nd order of scattering: the inscattered luminance is (InScatteredLuminance * MultiScatAs1 * MultiScatAs1)
	//  - etc.
#if	MULTI_SCATTERING_POWER_SERIE==0
	float3 MultiScatAs1SQR = MultiScatAs1 * MultiScatAs1;
	float3 L = InScatteredLuminance * (1.0 + MultiScatAs1 + MultiScatAs1SQR + MultiScatAs1 * MultiScatAs1SQR + MultiScatAs1SQR * MultiScatAs1SQR);
#else
	// For a serie, sum_{n=0}^{n=+inf} = 1 + r + r^2 + r^3 + ... + r^n = 1 / (1.0 - r), see https://en.wikipedia.org/wiki/Geometric_series  
	float3 R = MultiScatAs1;
	float3 SumOfAllMultiScatteringEventsContribution = 1.0 / (1.0 - R);
	float3 L = InScatteredLuminance * SumOfAllMultiScatteringEventsContribution;
#endif

	// MultipleScatteringFactor can be applied here because the LUT is compute every frame
	// L is pre-exposed since InScatteredLuminance is computed from pre-exposed sun light. So multi-scattering contribution is pre-exposed.
	// MultiScatteredLuminanceLutUAV[int2(PixPos)] = L * Atmosphere.MultiScatteringFactor;
    gl_FragColor = vec4(L * Atmosphere.MultiScatteringFactor, 1);
    // gl_FragColor = vec4(vec3(UniformSphereSamplesBuffer[2].xyz/3.), 1);
    // gl_FragColor = vec4(vec3((SkyAtmosphere.MultiScatteringSampleCount/20.)), 1);
    // gl_FragColor = texture2D(TransmittanceLutTexture, vUV);
    // gl_FragColor = vec4(vUV, 0, 1);
    // gl_FragColor = vec4(CosLightZenithAngle, 0, 0, 1);
    // gl_FragColor = vec4(0, (ViewHeight-Atmosphere.BottomRadiusKm)/(Atmosphere.TopRadiusKm-Atmosphere.BottomRadiusKm), 0, 1);
}