
#ifndef PI
#define PI 3.1415926535897932
#endif


// The constants below should match the one in SceneRendering.cpp
// Kilometers as unit for computations related to the sky and its atmosphere
#define CM_TO_SKY_UNIT 0.00001
#define SKY_UNIT_TO_CM (1.0/CM_TO_SKY_UNIT)
// Float accuracy offset in Sky unit (km, so this is 1m)
#define PLANET_RADIUS_OFFSET 0.001



// const bool HAS_INVERTED_Z_BUFFER = false;
#ifndef HAS_INVERTED_Z_BUFFER
#define HAS_INVERTED_Z_BUFFER	0
#endif


// #ifndef COLORED_TRANSMITTANCE_ENABLED	// Never used, UE4 does not supports dual blending
// #define COLORED_TRANSMITTANCE_ENABLED 0 
// #endif
#ifndef MULTISCATTERING_APPROX_ENABLED 
#define MULTISCATTERING_APPROX_ENABLED 0 
#endif
#ifndef HIGHQUALITY_MULTISCATTERING_APPROX_ENABLED 
#define HIGHQUALITY_MULTISCATTERING_APPROX_ENABLED 0 
#endif
#ifndef FASTSKY_ENABLED 
#define FASTSKY_ENABLED 0 
#endif
// #ifndef FASTAERIALPERSPECTIVE_ENABLED 
// #define FASTAERIALPERSPECTIVE_ENABLED 0 
// #endif
#ifndef SOURCE_DISK_ENABLED
#define SOURCE_DISK_ENABLED 0
#endif
#ifndef SECOND_ATMOSPHERE_LIGHT_ENABLED
#define SECOND_ATMOSPHERE_LIGHT_ENABLED 0
#endif
#ifndef RENDERSKY_ENABLED
#define RENDERSKY_ENABLED 0
#endif



#ifndef SAMPLE_ATMOSPHERE_ON_CLOUDS
#define SAMPLE_ATMOSPHERE_ON_CLOUDS 0
#endif





#ifndef TRANSMITTANCE_PASS
#define TRANSMITTANCE_PASS 0
#endif
#ifndef MULTISCATT_PASS
#define MULTISCATT_PASS 0
#endif
#ifndef SKYLIGHT_PASS
#define SKYLIGHT_PASS 0
#endif

// View data is not available for passes running once per scene (and not once per view).
#define VIEWDATA_AVAILABLE (TRANSMITTANCE_PASS!=1 && MULTISCATT_PASS!=1 && SKYLIGHT_PASS!=1)


#if VIEWDATA_AVAILABLE
// Exposure used for regular views by the FastSky and AP LUTs.
#define ViewPreExposure			View.PreExposure
#define ViewOneOverPreExposure	View.OneOverPreExposure
// When rendering a real time reflection capture (sky envmap) whe use a different output exposure
#define OutputPreExposure		(View.RealTimeReflectionCapture ? View.RealTimeReflectionCapturePreExposure : View.PreExposure)
#else
#define ViewPreExposure			1.0
#define ViewOneOverPreExposure	1.0
#define OutputPreExposure		1.0
#endif
// #define USE_PREEXPOSURE 0//TODO:
// #if USE_PREEXPOSURE && VIEWDATA_AVAILABLE
// #define ViewPreExposure View.PreExposure
// #define ViewOneOverPreExposure View.OneOverPreExposure
// #else
// #define ViewPreExposure 1.0
// #define ViewOneOverPreExposure 1.0
// #endif

#define FarDepthValue  (bool(HAS_INVERTED_Z_BUFFER) ? 0.0 : 1.0)



#define DEFAULT_SAMPLE_OFFSET 0.3
// float SkyAtmosphereNoise(float2 UV)
// {
// 	//	return DEFAULT_SAMPLE_OFFSET;
// 	//	return float(Rand3DPCG32(int3(UV.x, UV.y, S)).x) / 4294967296.0;
// #if VIEWDATA_AVAILABLE && PER_PIXEL_NOISE
// 	return InterleavedGradientNoise(UV.xy, float(View.StateFrameIndexMod8));
// #else
// 	return DEFAULT_SAMPLE_OFFSET;
// #endif
// }



struct SamplingSetup
{
    bool VariableSampleCount;
    float SampleCountIni;			// Used when VariableSampleCount is false
    float MinSampleCount;
    float MaxSampleCount;
    float DistanceToSampleCountMaxInv;
};

uniform struct {
    float MultiScatteringFactor;
    float BottomRadiusKm;
    float TopRadiusKm;
    float RayleighDensityExpScale;
    float3 RayleighScattering;
    float3 MieScattering;
    float MieDensityExpScale;
    float3 MieExtinction;
    float MiePhaseG;
    float3 MieAbsorption;
    float AbsorptionDensity0LayerWidth;
    float AbsorptionDensity0LinearTerm;
    float AbsorptionDensity1LinearTerm;
    float AbsorptionDensity0ConstantTerm;
    float AbsorptionDensity1ConstantTerm;
    float3 AbsorptionExtinction;
    float3 GroundAlbedo;
} Atmosphere;

uniform struct {
    vec4 TransmittanceLutSizeAndInvSize;
    float TransmittanceSampleCount;

    vec4 MultiScatteredLuminanceLutSizeAndInvSize;
    float MultiScatteringSampleCount;

    vec4 SkyViewLutSizeAndInvSize;
    float FastSkySampleCountMin;
    float FastSkySampleCountMax;
    float FastSkyDistanceToSampleCountMaxInv;

    float SampleCountMin;
    float SampleCountMax;
    float DistanceToSampleCountMaxInv;

    float3 SkyLuminanceFactor;
} SkyAtmosphere;


uniform sampler2D TransmittanceLutTexture;
uniform sampler2D MultiScatteredLuminanceLutTexture;
uniform sampler2D SkyViewLutTexture;


/**
 * Returns near intersection in x, far intersection in y, or both -1 if no intersection.
 * RayDirection does not need to be unit length.
 */
float2 RayIntersectSphere(float3 RayOrigin, float3 RayDirection, float4 Sphere)
{
    float3 LocalPosition = RayOrigin - Sphere.xyz;
    float LocalPositionSqr = dot(LocalPosition, LocalPosition);

    float3 QuadraticCoef;
    QuadraticCoef.x = dot(RayDirection, RayDirection);
    QuadraticCoef.y = 2. * dot(RayDirection, LocalPosition);
    QuadraticCoef.z = LocalPositionSqr - Sphere.w * Sphere.w;

    float Discriminant = QuadraticCoef.y * QuadraticCoef.y - 4. * QuadraticCoef.x * QuadraticCoef.z;

    float2 Intersections = float2(-1);

    // Only continue if the ray intersects the sphere
    // FLATTEN
    if (Discriminant >= 0.)
    {
        float SqrtDiscriminant = sqrt(Discriminant);
        Intersections = (-QuadraticCoef.y + float2(-1, 1) * SqrtDiscriminant) / (2. * QuadraticCoef.x);
    }

    return Intersections;
}

// - RayOrigin: ray origin
// - RayDir: normalized ray direction
// - SphereCenter: sphere center
// - SphereRadius: sphere radius
// - Returns distance from RayOrigin to closest intersecion with sphere,
//   or -1.0 if no intersection.
float RaySphereIntersectNearest(float3 RayOrigin, float3 RayDir, float3 SphereCenter, float SphereRadius)
{
    float2 Sol = RayIntersectSphere(RayOrigin, RayDir, float4(SphereCenter, SphereRadius));
    float Sol0 = Sol.x;
    float Sol1 = Sol.y;
    if (Sol0 < 0.0 && Sol1 < 0.0)
    {
        return -1.0;
    }
    if (Sol0 < 0.0)
    {
        return max(0.0, Sol1);
    }
    else if (Sol1 < 0.0)
    {
        return max(0.0, Sol0);
    }
    return max(0.0, min(Sol0, Sol1));
}



void UvToLutTransmittanceParams(out float ViewHeight, out float ViewZenithCosAngle, in float2 UV)
{
    //UV = FromSubUvsToUnit(UV, SkyAtmosphere.TransmittanceLutSizeAndInvSize); // No real impact so off
    float Xmu = UV.x;
    float Xr = UV.y;

    float H = sqrt(Atmosphere.TopRadiusKm * Atmosphere.TopRadiusKm - Atmosphere.BottomRadiusKm * Atmosphere.BottomRadiusKm);
    float Rho = H * Xr;
    ViewHeight = sqrt(Rho * Rho + Atmosphere.BottomRadiusKm * Atmosphere.BottomRadiusKm);

    float Dmin = Atmosphere.TopRadiusKm - ViewHeight;
    float Dmax = Rho + H;
    float D = Dmin + Xmu * (Dmax - Dmin);
    ViewZenithCosAngle = D == 0.0 ? 1.0 : (H * H - Rho * Rho - D * D) / (2.0 * ViewHeight * D);
    ViewZenithCosAngle = clamp(ViewZenithCosAngle, -1.0, 1.0);
}

float2 FromUnitToSubUvs(float2 uv, float4 SizeAndInvSize) { return (uv + 0.5 * SizeAndInvSize.zw) * (SizeAndInvSize.xy / (SizeAndInvSize.xy + 1.0)); }
float2 FromSubUvsToUnit(float2 uv, float4 SizeAndInvSize) { return (uv - 0.5 * SizeAndInvSize.zw) * (SizeAndInvSize.xy / (SizeAndInvSize.xy - 1.0)); }

void getTransmittanceLutUvs(
    in float viewHeight, in float viewZenithCosAngle, in float BottomRadius, in float TopRadius,
    out float2 UV)
{
    float H = sqrt(max(0.0, TopRadius * TopRadius - BottomRadius * BottomRadius));
    float Rho = sqrt(max(0.0, viewHeight * viewHeight - BottomRadius * BottomRadius));

    float Discriminant = viewHeight * viewHeight * (viewZenithCosAngle * viewZenithCosAngle - 1.0) + TopRadius * TopRadius;
    float D = max(0.0, (-viewHeight * viewZenithCosAngle + sqrt(Discriminant))); // Distance to atmosphere boundary

    float Dmin = TopRadius - viewHeight;
    float Dmax = Rho + H;
    float Xmu = (D - Dmin) / (Dmax - Dmin);
    float Xr = Rho / H;

    UV = float2(Xmu, Xr);
    //UV = float2(fromUnitToSubUvs(UV.x, TRANSMITTANCE_TEXTURE_WIDTH), fromUnitToSubUvs(UV.y, TRANSMITTANCE_TEXTURE_HEIGHT)); // No real impact so off
}


void SkyViewLutParamsToUv(
	in bool IntersectGround, in float ViewZenithCosAngle, in float3 ViewDir, in float ViewHeight, in float BottomRadius, in float4 SkyViewLutSizeAndInvSize,
	out float2 UV)
{
	float Vhorizon = sqrt(ViewHeight * ViewHeight - BottomRadius * BottomRadius);
	float CosBeta = Vhorizon / ViewHeight;				// GroundToHorizonCos
	float Beta = acosFast4(CosBeta);
	float ZenithHorizonAngle = PI - Beta;
	float ViewZenithAngle = acosFast4(ViewZenithCosAngle);

	if (!IntersectGround)
	{
		float Coord = ViewZenithAngle / ZenithHorizonAngle;
		Coord = 1.0 - Coord;
		Coord = sqrt(Coord);
		Coord = 1.0 - Coord;
		UV.y = Coord * 0.5;
	}
	else
	{
		float Coord = (ViewZenithAngle - ZenithHorizonAngle) / Beta;
		Coord = sqrt(Coord);
		UV.y = Coord * 0.5 + 0.5;
	}

	{
		UV.x = (atan2Fast(-ViewDir.y, -ViewDir.x) + PI) / (2.0 * PI);
	}

	// Constrain uvs to valid sub texel range (avoid zenith derivative issue making LUT usage visible)
	UV = FromUnitToSubUvs(UV, SkyViewLutSizeAndInvSize);
}

void LutTransmittanceParamsToUv(in float ViewHeight, in float ViewZenithCosAngle, out float2 UV)
{
    getTransmittanceLutUvs(ViewHeight, ViewZenithCosAngle, Atmosphere.BottomRadiusKm, Atmosphere.TopRadiusKm, UV);
}

float3x3 GetSkyViewLutReferential(in float3 WorldPos, in float3 ViewForward, in float3 ViewRight)
{
	float3 Up = normalize(WorldPos);
	float3 Forward = ViewForward;  // This can make texel visible when the camera is rotating. Use constant worl direction instead?
    // FIXME: 左手坐标系？
	float3 Right = normalize(cross(Forward, Up));
	if (abs(dot(Forward, Up)) > 0.99)
	{
		Right = ViewRight;
	}
	Forward = normalize(cross(Up, Right));
	// float3x3 LocalReferencial = transpose(float3x3(Right, Forward, Up));
	float3x3 LocalReferencial = float3x3(Right, Forward, Up);
	return LocalReferencial;
}

float3 GetMultipleScattering(float3 WorlPos, float ViewZenithCosAngle)
{
	float2 UV = saturate(float2(ViewZenithCosAngle*0.5 + 0.5, (length(WorlPos) - Atmosphere.BottomRadiusKm) / (Atmosphere.TopRadiusKm - Atmosphere.BottomRadiusKm)));
	// We do no apply UV transform to sub range here as it has minimal impact.
	// float3 MultiScatteredLuminance = MultiScatteredLuminanceLutTexture.SampleLevel(MultiScatteredLuminanceLutTextureSampler, UV, 0).rgb;
	float3 MultiScatteredLuminance = texture2D(MultiScatteredLuminanceLutTexture, UV).rgb;
	return MultiScatteredLuminance;
}

float3 GetTransmittance(in float LightZenithCosAngle, in float PHeight)
{
    float2 UV;
    LutTransmittanceParamsToUv(PHeight, LightZenithCosAngle, UV);
#ifdef WHITE_TRANSMITTANCE
    float3 TransmittanceToLight = float3(1.0);
#else
    // float3 TransmittanceToLight = TransmittanceLutTexture.SampleLevel(TransmittanceLutTextureSampler, UV, 0).rgb;
    float3 TransmittanceToLight = texture2D(TransmittanceLutTexture, UV).rgb;
#endif
    return TransmittanceToLight;
}

// float4 GetScreenWorldPos(float4 SVPos, float DeviceZ)
// {
// #if HAS_INVERTED_Z_BUFFER
// 	DeviceZ = max(0.000000000001, DeviceZ);	// TODO: investigate why SvPositionToWorld returns bad values when DeviceZ is far=0 when using inverted z
// #endif
// 	return float4(SvPositionToWorld(float4(SVPos.xy, DeviceZ, 1.0)), 1.0);
// }


float3 GetAtmosphereTransmittance(
	float3 WorldPos, float3 WorldDir, float BottomRadius, float TopRadius,
	sampler2D TransmittanceLutTexture/*, SamplerState TransmittanceLutTextureSampler*/)
{
	// For each view height entry, transmittance is only stored from zenith to horizon. Earth shadow is not accounted for.
	// It does not contain earth shadow in order to avoid texel linear interpolation artefact when LUT is low resolution.
	// As such, at the most shadowed point of the LUT when close to horizon, pure black with earth shadow is never hit.
	// That is why we analytically compute the virtual planet shadow here.
	float2 Sol = RayIntersectSphere(WorldPos, WorldDir, float4(float3(0.0, 0.0, 0.0), BottomRadius));
	if (Sol.x > 0.0 || Sol.y > 0.0)
	{
		return float3(0.0);
	}

	float PHeight = length(WorldPos);
	float3 UpVector = WorldPos / PHeight;
	float LightZenithCosAngle = dot(WorldDir, UpVector);
	float2 TransmittanceLutUv;
	getTransmittanceLutUvs(PHeight, LightZenithCosAngle, BottomRadius, TopRadius, TransmittanceLutUv);
	// const float3 TransmittanceToLight = Texture2DSampleLevel(TransmittanceLutTexture, TransmittanceLutTextureSampler, TransmittanceLutUv, 0.0f).rgb;
	float3 TransmittanceToLight = texture2D(TransmittanceLutTexture, TransmittanceLutUv).rgb;
	return TransmittanceToLight;
}


float3 GetLightDiskLuminance(
	float3 WorldPos, float3 WorldDir, float BottomRadius, float TopRadius,
	sampler2D TransmittanceLutTexture,/* SamplerState TransmittanceLutTextureSampler,*/
	float3 AtmosphereLightDirection, float AtmosphereLightDiscCosHalfApexAngle, float3 AtmosphereLightDiscLuminance)
{
	float ViewDotLight = dot(WorldDir, AtmosphereLightDirection);
	float CosHalfApex = AtmosphereLightDiscCosHalfApexAngle;
	if (ViewDotLight > CosHalfApex)
	{
		float3 TransmittanceToLight = GetAtmosphereTransmittance(
			WorldPos, WorldDir, BottomRadius, TopRadius, TransmittanceLutTexture/*, TransmittanceLutTextureSampler*/);

		return TransmittanceToLight * AtmosphereLightDiscLuminance;
	}
	return float3(0.0);
}

float3 GetLightDiskLuminance0(float3 WorldPos, float3 WorldDir/*, const uint LightIndex*/)
{
#if SOURCE_DISK_ENABLED
	float t = RaySphereIntersectNearest(WorldPos, WorldDir, float3(0.0, 0.0, 0.0), Atmosphere.BottomRadiusKm);
	if (t < 0.0												// No intersection with the planet
		&& View.RenderingReflectionCaptureMask==0.0)	// Do not render light disk when in reflection capture in order to avoid double specular. The sun contribution is already computed analyticaly.
	{
		float3 LightDiskLuminance = GetLightDiskLuminance(
			WorldPos, WorldDir, Atmosphere.BottomRadiusKm, Atmosphere.TopRadiusKm,
			TransmittanceLutTexture,/* TransmittanceLutTextureSampler,*/
			View.AtmosphereLightDirection[0].xyz, View.AtmosphereLightDiscCosHalfApexAngle[0].x, View.AtmosphereLightDiscLuminance[0].xyz);

		// Clamp to avoid crazy high values (and exposed 64000.0 luminance is already crazy high, solar system sun is 1.6x10^9). Also this removes +inf float and helps TAA.
		const float3 MaxLightLuminance = float3(64000.0);
		float3 ExposedLightLuminance = LightDiskLuminance * ViewPreExposure;
		ExposedLightLuminance = min(ExposedLightLuminance, MaxLightLuminance);

#if 1
		float ViewDotLight = dot(WorldDir, View.AtmosphereLightDirection[0].xyz);
		float CosHalfApex = View.AtmosphereLightDiscCosHalfApexAngle[0].x;
		float HalfCosHalfApex = CosHalfApex + (1.0 - CosHalfApex) * 0.25; // Start fading when at 75% distance from light disk center (in cosine space)

		// Apply smooth fading at edge. This is currently an eye balled fade out that works well in many cases.
		float Weight = 1.0-saturate((HalfCosHalfApex - ViewDotLight) / (HalfCosHalfApex - CosHalfApex));
		ExposedLightLuminance = ExposedLightLuminance * Weight;
#endif 

		return ExposedLightLuminance;
	}
#endif
	return float3(0.0);
}

float3 GetLightDiskLuminance1(float3 WorldPos, float3 WorldDir/*, const uint LightIndex*/)
{
#if SOURCE_DISK_ENABLED
	float t = RaySphereIntersectNearest(WorldPos, WorldDir, float3(0.0, 0.0, 0.0), Atmosphere.BottomRadiusKm);
	if (t < 0.0												// No intersection with the planet
		&& View.RenderingReflectionCaptureMask==0.0)	// Do not render light disk when in reflection capture in order to avoid double specular. The sun contribution is already computed analyticaly.
	{
		float3 LightDiskLuminance = GetLightDiskLuminance(
			WorldPos, WorldDir, Atmosphere.BottomRadiusKm, Atmosphere.TopRadiusKm,
			TransmittanceLutTexture,/* TransmittanceLutTextureSampler,*/
			View.AtmosphereLightDirection[1].xyz, View.AtmosphereLightDiscCosHalfApexAngle[1].x, View.AtmosphereLightDiscLuminance[1].xyz);

		// Clamp to avoid crazy high values (and exposed 64000.0 luminance is already crazy high, solar system sun is 1.6x10^9). Also this removes +inf float and helps TAA.
		const float3 MaxLightLuminance = float3(64000.0);
		float3 ExposedLightLuminance = LightDiskLuminance * ViewPreExposure;
		ExposedLightLuminance = min(ExposedLightLuminance, MaxLightLuminance);

#if 1
		float ViewDotLight = dot(WorldDir, View.AtmosphereLightDirection[1].xyz);
		float CosHalfApex = View.AtmosphereLightDiscCosHalfApexAngle[1].x;
		float HalfCosHalfApex = CosHalfApex + (1.0 - CosHalfApex) * 0.25; // Start fading when at 75% distance from light disk center (in cosine space)

		// Apply smooth fading at edge. This is currently an eye balled fade out that works well in many cases.
		float Weight = 1.0-saturate((HalfCosHalfApex - ViewDotLight) / (HalfCosHalfApex - CosHalfApex));
		ExposedLightLuminance = ExposedLightLuminance * Weight;
#endif 

		return ExposedLightLuminance;
	}
#endif
	return float3(0.0);
}

////////////////////////////////////////////////////////////
// Participating medium properties
////////////////////////////////////////////////////////////

float RayleighPhase(float CosTheta)
{
    float Factor = 3.0 / (16.0 * PI);
    return Factor * (1.0 + CosTheta * CosTheta);
}

float HgPhase(float G, float CosTheta)
{
    // Reference implementation (i.e. not schlick approximation). 
    // See http://www.pbr-book.org/3ed-2018/Volume_Scattering/Phase_Functions.html
    float Numer = 1.0 - G * G;
    float Denom = 1.0 + G * G + 2.0 * G * CosTheta;
    return Numer / (4.0 * PI * Denom * sqrt(Denom));
}

float3 GetAlbedo(float3 Scattering, float3 Extinction)
{
    return Scattering / max(vec3(0.001), Extinction);
}

struct MediumSampleRGB
{
    float3 Scattering;
    float3 Absorption;
    float3 Extinction;

    float3 ScatteringMie;
    float3 AbsorptionMie;
    float3 ExtinctionMie;

    float3 ScatteringRay;
    float3 AbsorptionRay;
    float3 ExtinctionRay;

    float3 ScatteringOzo;
    float3 AbsorptionOzo;
    float3 ExtinctionOzo;

    float3 Albedo;
};

// If this is changed, please also update USkyAtmosphereComponent::GetTransmittance 
MediumSampleRGB SampleMediumRGB(in float3 WorldPos)
{
    float SampleHeight = max(0.0, (length(WorldPos) - Atmosphere.BottomRadiusKm));

    float DensityMie = exp(Atmosphere.MieDensityExpScale * SampleHeight);

    float DensityRay = exp(Atmosphere.RayleighDensityExpScale * SampleHeight);

    float DensityOzo = SampleHeight < Atmosphere.AbsorptionDensity0LayerWidth ?
        saturate(Atmosphere.AbsorptionDensity0LinearTerm * SampleHeight + Atmosphere.AbsorptionDensity0ConstantTerm) :	// We use saturate to allow the user to create plateau, and it is free on GCN.
        saturate(Atmosphere.AbsorptionDensity1LinearTerm * SampleHeight + Atmosphere.AbsorptionDensity1ConstantTerm);

    MediumSampleRGB s;

    s.ScatteringMie = DensityMie * Atmosphere.MieScattering.rgb;
    s.AbsorptionMie = DensityMie * Atmosphere.MieAbsorption.rgb;
    s.ExtinctionMie = DensityMie * Atmosphere.MieExtinction.rgb;

    s.ScatteringRay = DensityRay * Atmosphere.RayleighScattering.rgb;
    s.AbsorptionRay = float3(0.0);
    s.ExtinctionRay = s.ScatteringRay + s.AbsorptionRay;

    s.ScatteringOzo = float3(0.0);
    s.AbsorptionOzo = DensityOzo * Atmosphere.AbsorptionExtinction.rgb;
    s.ExtinctionOzo = s.ScatteringOzo + s.AbsorptionOzo;

    s.Scattering = s.ScatteringMie + s.ScatteringRay + s.ScatteringOzo;
    s.Absorption = s.AbsorptionMie + s.AbsorptionRay + s.AbsorptionOzo;
    s.Extinction = s.ExtinctionMie + s.ExtinctionRay + s.ExtinctionOzo;
    s.Albedo = GetAlbedo(s.Scattering, s.Extinction);

    return s;
}

float3 GetScreenWorldDir(in float4 SVPos)
{
    float4 ClipCoord = SvPositionToScreenPosition(SVPos);
    float4 WorldPos = mul(ClipCoord, View.ScreenToWorld);
    return normalize(WorldPos.xyz/WorldPos.w - View.WorldCameraOrigin);
	// float2 ScreenPosition = SvPositionToScreenPosition(SVPos).xy;
	// const float Depth = 1000000.0;
	// float4 WorldPos = mul(float4(ScreenPosition * Depth, Depth, 1), View.ScreenToWorld);
	// return normalize(WorldPos.xyz - View.WorldCameraOrigin);
}

// This is the world position of the camera. It is also force to be at the top of the virutal planet surface. 
// This is to always see the sky even when the camera is buried into the virtual planet.
float3 GetCameraWorldPos() {
    return View.SkyWorldCameraOrigin;
}

// This is the camera position relative to the virtual planet center.
// This is convenient because for all the math in this file using world position relative to the virtual planet center.
float3 GetCameraPlanetPos() {
    return (GetCameraWorldPos() - View.SkyPlanetCenterAndViewHeight.xyz) * CM_TO_SKY_UNIT;
}

bool MoveToTopAtmosphere(inout float3 WorldPos, in float3 WorldDir, in float AtmosphereTopRadius)
{
	float ViewHeight = length(WorldPos);
	if (ViewHeight > AtmosphereTopRadius)
	{
		float TTop = RaySphereIntersectNearest(WorldPos, WorldDir, float3(0.0, 0.0, 0.0), AtmosphereTopRadius);
		if (TTop >= 0.0)
		{
			float3 UpVector = WorldPos / ViewHeight;
			float3 UpOffset = UpVector * -PLANET_RADIUS_OFFSET;
			WorldPos = WorldPos + WorldDir * TTop + UpOffset;
		}
		else
		{
			// Ray is not intersecting the atmosphere
			return false;
		}
	}
	return true; // ok to start tracing
}

struct SingleScatteringResult
{
    float3 L;						// Scattered light (luminance)
    float3 OpticalDepth;			// Optical depth (1/m)
    float3 Transmittance;			// Transmittance in [0,1] (unitless)
    float3 MultiScatAs1;
};

// In this function, all world position are relative to the planet center (itself expressed within translated world space)
SingleScatteringResult IntegrateSingleScatteredLuminance(
    in float4 SVPos, in float3 WorldPos, in float3 WorldDir,
    in bool Ground, in SamplingSetup Sampling, in float DeviceZ, in bool MieRayPhase,
    in float3 Light0Dir, in float3 Light1Dir, in float3 Light0Illuminance, in float3 Light1Illuminance,
    in float AerialPespectiveViewDistanceScale,
    in float tMaxMax)
{
    SingleScatteringResult Result;
    Result.L = float3(0);
    Result.OpticalDepth = float3(0);
    Result.Transmittance = float3(1.0);
    Result.MultiScatAs1 = float3(0);

    if (dot(WorldPos, WorldPos) <= Atmosphere.BottomRadiusKm*Atmosphere.BottomRadiusKm)
    {
        return Result;	// Camera is inside the planet ground
    }


    float2 PixPos = SVPos.xy;

    // Compute next intersection with atmosphere or ground 
    float3 PlanetO = float3(0.0, 0.0, 0.0);
    float tBottom = RaySphereIntersectNearest(WorldPos, WorldDir, PlanetO, Atmosphere.BottomRadiusKm);
    float tTop = RaySphereIntersectNearest(WorldPos, WorldDir, PlanetO, Atmosphere.TopRadiusKm);
    float tMax = 0.0;
    if (tBottom < 0.0)
    {
        if (tTop < 0.0)
        {
            tMax = 0.0; // No intersection with planet nor its atmosphere: stop right away  
            return Result;
        }
        else
        {
            tMax = tTop;
        }
    }
    else
    {
        if (tTop > 0.0)
        {
            tMax = min(tTop, tBottom);
        }
    }

    float PlanetOnOpaque = 1.0; // This is used to hide opaque meshes under the planet ground

#if VIEWDATA_AVAILABLE
#if SAMPLE_ATMOSPHERE_ON_CLOUDS
#else // SAMPLE_ATMOSPHERE_ON_CLOUDS
    // if (DeviceZ != FarDepthValue)
    // {
    // 	const float3 DepthBufferWorldPosKm = GetScreenWorldPos(SVPos, DeviceZ).xyz * CM_TO_SKY_UNIT;
    // 	const float3 TraceStartWorldPosKm = WorldPos + View.SkyPlanetCenterAndViewHeight.xyz * CM_TO_SKY_UNIT; // apply planet offset to go back to world from planet local referencial.
    // 	const float3 TraceStartToSurfaceWorldKm = DepthBufferWorldPosKm - TraceStartWorldPosKm;
    // 	float tDepth = length(TraceStartToSurfaceWorldKm);
    // 	if (tDepth < tMax)
    // 	{
    // 		tMax = tDepth;
    // 	}
    // 	else
    // 	{
    // 		// Artists did not like that we handle automatic hiding of opaque element behind the planet.
    // 		// Now, pixel under the surface of earht will receive aerial perspective as if they were  on the ground.
    // 		//PlanetOnOpaque = 0.0;
    // 	}

    // 	//if the ray intersects with the atmosphere boundary, make sure we do not apply atmosphere on surfaces are front of it. 
    // 	if (dot(WorldDir, TraceStartToSurfaceWorldKm) < 0.0)
    // 	{
    // 		return Result;
    // 	}
    // }
#endif
#endif
    tMax = min(tMax, tMaxMax);

    // Sample count 
    float SampleCount = Sampling.SampleCountIni;
    float SampleCountFloor = Sampling.SampleCountIni;
    float tMaxFloor = tMax;
    if (Sampling.VariableSampleCount)
    {
        SampleCount = lerp(Sampling.MinSampleCount, Sampling.MaxSampleCount, saturate(tMax*Sampling.DistanceToSampleCountMaxInv));
        SampleCountFloor = floor(SampleCount);
        tMaxFloor = tMax * SampleCountFloor / SampleCount;	// rescale tMax to map to the last entire step segment.
    }
    float dt = tMax / SampleCount;

    // Phase functions
    const float uniformPhase = 1.0 / (4.0 * PI);
    float3 wi = Light0Dir;
    float3 wo = WorldDir;
    float cosTheta = dot(wi, wo);
    float MiePhaseValueLight0 = HgPhase(Atmosphere.MiePhaseG, -cosTheta);	// negate cosTheta because due to WorldDir being a "in" direction. 
    float RayleighPhaseValueLight0 = RayleighPhase(cosTheta);
#if SECOND_ATMOSPHERE_LIGHT_ENABLED
    cosTheta = dot(Light1Dir, wo);
    float MiePhaseValueLight1 = HgPhase(Atmosphere.MiePhaseG, -cosTheta);	// negate cosTheta because due to WorldDir being a "in" direction. 
    float RayleighPhaseValueLight1 = RayleighPhase(cosTheta);
#endif

    // Ray march the atmosphere to integrate optical depth
    float3 L = float3(0.0);
    float3 Throughput = float3(1.0);
    float3 OpticalDepth = float3(0.0);
    float t = 0.0;
    float tPrev = 0.0;

    float3 ExposedLight0Illuminance = Light0Illuminance * OutputPreExposure;
#if SECOND_ATMOSPHERE_LIGHT_ENABLED
    float3 ExposedLight1Illuminance = Light1Illuminance * OutputPreExposure;
#endif

    // float PixelNoise = PER_PIXEL_NOISE ? SkyAtmosphereNoise(PixPos.xy) : DEFAULT_SAMPLE_OFFSET;
    float PixelNoise = DEFAULT_SAMPLE_OFFSET;
    // FIXME: Loop index cannot be compared with non-constant expression
    for (float SampleI = 0.0; SampleI < float(INTEGRATE_SAMPLE_COUNT) /*SampleCount*/; SampleI += 1.0)
    {
        // Compute current ray t and sample point P
        if (Sampling.VariableSampleCount)
        {
            // More expenssive but artefact free
            float t0 = (SampleI) / SampleCountFloor;
            float t1 = (SampleI + 1.0) / SampleCountFloor;;
            // Non linear distribution of samples within the range.
            t0 = t0 * t0;
            t1 = t1 * t1;
            // Make t0 and t1 world space distances.
            t0 = tMaxFloor * t0;
            if (t1 > 1.0)
            {
                t1 = tMax;
                //t1 = tMaxFloor;	// this reveal depth slices
            }
            else
            {
                t1 = tMaxFloor * t1;
            }
            t = t0 + (t1 - t0) * PixelNoise;
            dt = t1 - t0;
        }
        else
        {
            t = tMax * (SampleI + PixelNoise) / SampleCount;
        }
        float3 P = WorldPos + t * WorldDir;
        float PHeight = length(P);

        // Sample the medium
        MediumSampleRGB Medium = SampleMediumRGB(P);
        float3 SampleOpticalDepth = Medium.Extinction * dt * AerialPespectiveViewDistanceScale;
        float3 SampleTransmittance = exp(-SampleOpticalDepth);
        OpticalDepth += SampleOpticalDepth;

        // Phase and transmittance for light 0
        float3 UpVector = P / PHeight;
        float Light0ZenithCosAngle = dot(Light0Dir, UpVector);
        float3 TransmittanceToLight0 = GetTransmittance(Light0ZenithCosAngle, PHeight);
        float3 PhaseTimesScattering0;
        if (MieRayPhase)
        {
            PhaseTimesScattering0 = Medium.ScatteringMie * MiePhaseValueLight0 + Medium.ScatteringRay * RayleighPhaseValueLight0;
        }
        else
        {
            PhaseTimesScattering0 = Medium.Scattering * uniformPhase;
        }
#if SECOND_ATMOSPHERE_LIGHT_ENABLED
		// Phase and transmittance for light 1
		float Light1ZenithCosAngle = dot(Light1Dir, UpVector);
		float3 TransmittanceToLight1 = GetTransmittance(Light1ZenithCosAngle, PHeight);
		float3 PhaseTimesScattering1;
		if (MieRayPhase)
		{
			PhaseTimesScattering1 = Medium.ScatteringMie * MiePhaseValueLight1 + Medium.ScatteringRay * RayleighPhaseValueLight1;
		}
		else
		{
			PhaseTimesScattering1 = Medium.Scattering * uniformPhase;
		}
#endif

        // Multiple scattering approximation
        float3 MultiScatteredLuminance0 = float3(0.0);
#if MULTISCATTERING_APPROX_ENABLED
        MultiScatteredLuminance0 = GetMultipleScattering(P, Light0ZenithCosAngle);
#endif
        // Planet shadow
        float tPlanet0 = RaySphereIntersectNearest(P, Light0Dir, PlanetO + PLANET_RADIUS_OFFSET * UpVector, Atmosphere.BottomRadiusKm);
        float PlanetShadow0 = tPlanet0 >= 0.0 ? 0.0 : 1.0;
        // MultiScatteredLuminance is already pre-exposed, atmospheric light contribution needs to be pre exposed
        // Multi-scattering is also not affected by PlanetShadow or TransmittanceToLight because it contains diffuse light after single scattering.
        float3 S = ExposedLight0Illuminance * (PlanetShadow0 * TransmittanceToLight0 * PhaseTimesScattering0 + MultiScatteredLuminance0 * Medium.Scattering);

#if SECOND_ATMOSPHERE_LIGHT_ENABLED
        float tPlanet1 = RaySphereIntersectNearest(P, Light1Dir, PlanetO + PLANET_RADIUS_OFFSET * UpVector, Atmosphere.BottomRadiusKm);
        float PlanetShadow1 = tPlanet1 >= 0.0 ? 0.0 : 1.0;
        //  Multi-scattering can work for the second light but it is disabled for the sake of performance.
        S += ExposedLight1Illuminance * PlanetShadow1 * TransmittanceToLight1 * PhaseTimesScattering1;// +MultiScatteredLuminance * Medium.Scattering);
#endif

        // When using the power serie to accumulate all sattering order, serie r must be <1 for a serie to converge. 
        // Under extreme coefficient, MultiScatAs1 can grow larger and thus results in broken visuals. 
        // The way to fix that is to use a proper analytical integration as porposed in slide 28 of http://www.frostbite.com/2015/08/physically-based-unified-volumetric-rendering-in-frostbite/ 
        // However, it is possible to disable as it can also work using simple power serie sum unroll up to 5th order. The rest of the orders has a really low contribution. 
#define MULTI_SCATTERING_POWER_SERIE 0 
#if MULTI_SCATTERING_POWER_SERIE==0 
        // 1 is the integration of luminance over the 4pi of a sphere, and assuming an isotropic phase function of 1.0/(4*PI) 
        Result.MultiScatAs1 += Throughput * Medium.Scattering * 1.0 * dt;
#else 
        float3 MS = Medium.Scattering * 1.;
        float3 MSint = (MS - MS * SampleTransmittance) / Medium.Extinction;
        Result.MultiScatAs1 += Throughput * MSint;
#endif

#if 0
        L += Throughput * S * dt;
        Throughput *= SampleTransmittance;
#else
        // See slide 28 at http://www.frostbite.com/2015/08/physically-based-unified-volumetric-rendering-in-frostbite/ 
        float3 Sint = (S - S * SampleTransmittance) / Medium.Extinction;	// integrate along the current step segment 
        L += Throughput * Sint;														// accumulate and also take into account the transmittance from previous steps
        Throughput *= SampleTransmittance;
#endif

        tPrev = t;
    }

    if (Ground && tMax == tBottom)
    {
        // Account for bounced light off the planet
        float3 P = WorldPos + tBottom * WorldDir;
        float PHeight = length(P);

        float3 UpVector = P / PHeight;
        float Light0ZenithCosAngle = dot(Light0Dir, UpVector);
        float3 TransmittanceToLight0 = GetTransmittance(Light0ZenithCosAngle, PHeight);

        float NdotL0 = saturate(dot(UpVector, Light0Dir));
        L += Light0Illuminance * TransmittanceToLight0 * Throughput * NdotL0 * Atmosphere.GroundAlbedo.rgb / PI;
#if SECOND_ATMOSPHERE_LIGHT_ENABLED
        {
            float NdotL1 = saturate(dot(UpVector, Light1Dir));
            float Light1ZenithCosAngle = dot(UpVector, Light1Dir);
            float3 TransmittanceToLight1 = GetTransmittance(Light1ZenithCosAngle, PHeight);
            L += Light1Illuminance * TransmittanceToLight1 * Throughput * NdotL1 * Atmosphere.GroundAlbedo.rgb / PI;
        }
#endif
    }

    Result.L = L;
    Result.OpticalDepth = OpticalDepth;
    Result.Transmittance = Throughput * PlanetOnOpaque;

    return Result;
}

SingleScatteringResult IntegrateSingleScatteredLuminance(
    in float4 SVPos, in float3 WorldPos, in float3 WorldDir,
    in bool Ground, in SamplingSetup Sampling, in float DeviceZ, in bool MieRayPhase,
    in float3 Light0Dir, in float3 Light1Dir, in float3 Light0Illuminance, in float3 Light1Illuminance,
    in float AerialPespectiveViewDistanceScale)
{
    return IntegrateSingleScatteredLuminance(SVPos, WorldPos, WorldDir,
        Ground, Sampling, DeviceZ, MieRayPhase,
        Light0Dir, Light1Dir, Light0Illuminance, Light1Illuminance,
        AerialPespectiveViewDistanceScale,
        9000000.0);
}