
vec3 jodieReinhardTonemap(vec3 c) {
  // From: https://www.shadertoy.com/view/tdSXzD
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 tc = c / (c + 1.0);
  return mix(c / (l + 1.0), tc, tc);
}

const float Max10BitsFloat = 64512.0;
#define OutLuminance gl_FragColor

float4 PrepareOutput(float3 Luminance, float3 Transmittance)
{
	float GreyScaleTransmittance = dot(Transmittance, float3(1.0 / 3.0, 1.0 / 3.0, 1.0 / 3.0));
	return float4(min(Luminance, float(Max10BitsFloat)), GreyScaleTransmittance);
}

float4 PrepareOutput(float3 Luminance)
{
    return PrepareOutput(Luminance, float3(1.0, 1.0, 1.0));
}

void RenderSkyAtmosphereRayMarchingPS() {
    float4 SVPos = vec4(gl_FragCoord.xyz, 1./gl_FragCoord.w);

    OutLuminance = float4(0);

    float2 PixPos = SVPos.xy;
    float2 UvBuffer = PixPos * View.BufferSizeAndInvSize.zw;	// Uv for depth buffer read (size can be larger than viewport)

    float3 WorldPos = GetCameraPlanetPos();
    float3 WorldDir = GetScreenWorldDir(SVPos);

    // Get the light disk luminance to draw 
	float3 PreExposedL = float3(0);
	float3 LuminanceScale = float3(1.0);
    // 查找深度纹理的深度值
	// float DeviceZ = LookupDeviceZ(UvBuffer);
    float DeviceZ = 1.0;
	if (DeviceZ == FarDepthValue)
	{
		LuminanceScale = SkyAtmosphere.SkyLuminanceFactor;
		PreExposedL += GetLightDiskLuminance0(WorldPos, WorldDir);
#if SECOND_ATMOSPHERE_LIGHT_ENABLED
		PreExposedL += GetLightDiskLuminance1(WorldPos, WorldDir);
#endif

#if RENDERSKY_ENABLED==0
		// // We should not render the sky and the current pixels are at far depth, so simply early exit.
		// // We enable depth bound when supported to not have to even process those pixels.
		// OutLuminance = PrepareOutput(float3(0.0f, 0.0f, 0.0f), float3(1.0f, 1.0f, 1.0f));

		// //Now the sky pass can ignore the pixel with depth == far but it will need to alpha clip because not all RHI backend support depthbound tests.
		// // And the depthtest is already setup to avoid writing all the pixel closer than to the camera than the start distance (very good optimisation).
		// // Since this shader does not write to depth or stencil it should still benefit from EArlyZ even with the clip (See AMD depth-in-depth documentation)
		// clip(-1.0f);
		// return;
#endif
    }

    float ViewHeight = length(WorldPos);
#if FASTSKY_ENABLED && RENDERSKY_ENABLED
    if (ViewHeight < Atmosphere.TopRadiusKm && DeviceZ == FarDepthValue)
	{
		float2 UV;

		// The referencial used to build the Sky View lut
		float3x3 LocalReferencial = GetSkyViewLutReferential(WorldPos, View.ViewForward, View.ViewRight);

		// Input vectors expressed in this referencial: Up is always Z. Also note that ViewHeight is unchanged in this referencial.
		float3 WorldPosLocal = float3(0.0, 0.0, ViewHeight);
		float3 UpVectorLocal = float3(0.0, 0.0, 1.0);
		float3 WorldDirLocal = mul(WorldDir, LocalReferencial);

		// Now evaluate inputs in the referential.
		float ViewZenithCosAngle = dot(WorldDirLocal, UpVectorLocal);
		bool IntersectGround = RaySphereIntersectNearest(WorldPosLocal, WorldDirLocal, float3(0, 0, 0), Atmosphere.BottomRadiusKm) >= 0.0;

		SkyViewLutParamsToUv(IntersectGround, ViewZenithCosAngle, WorldDirLocal, ViewHeight, Atmosphere.BottomRadiusKm, SkyAtmosphere.SkyViewLutSizeAndInvSize, UV);
		// float3 SkyLuminance = SkyViewLutTexture.SampleLevel(SkyViewLutTextureSampler, UV, 0).rgb;
		float3 SkyLuminance = texture2D(SkyViewLutTexture, UV).rgb;

		PreExposedL += SkyLuminance * LuminanceScale;
		OutLuminance = PrepareOutput(PreExposedL);
        OutLuminance.rgb = jodieReinhardTonemap(OutLuminance.rgb);
        // OutLuminance.a = 1.;
        // gl_FragColor = texture2D(TransmittanceLutTexture, vUV.xy);
        // gl_FragColor = texture2D(MultiScatteredLuminanceLutTexture, vUV.xy);
        // gl_FragColor = texture2D(SkyViewLutTexture, vUV.xy);
		return;
	}
#endif


    // gl_FragColor = vec4(1, 0, 0, 1);
    // gl_FragColor = vec4(vUV, 0, 1);
    // gl_FragColor = texture2D(SkyViewLutTexture, vUV.xy);
    // gl_FragColor.rgb = vec3(WorldDir);
    // gl_FragColor.rgb = vec3(SVPos.z);
    // gl_FragColor.rgb = vec3(UvBuffer, 0);
    // gl_FragColor.rgb = jodieReinhardTonemap(gl_FragColor.rgb);
    // gl_FragColor.rgb = pow(gl_FragColor.rgb, vec3(1.0/2.2));
}