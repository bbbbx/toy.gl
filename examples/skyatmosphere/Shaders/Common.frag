
uniform struct {
    float PreExposure;
    float OneOverPreExposure;
    bool RealTimeReflectionCapture;
    float RealTimeReflectionCapturePreExposure;
    float3 SkyWorldCameraOrigin;
    float4 SkyPlanetCenterAndViewHeight;
    float3 ViewForward;
    float3 ViewRight;
    float3 AtmosphereLightDirection[2];
    float4 AtmosphereLightColor[2];

    float4 BufferSizeAndInvSize;
    float4 ViewRectMin;
    float4 ViewSizeAndInvSize;

    float4x4 ScreenToWorld;
    float3   WorldCameraOrigin;

    float RenderingReflectionCaptureMask;

    float4 AtmosphereLightDiscCosHalfApexAngle[2];
    float4 AtmosphereLightDiscLuminance[2];
} View;

// investigate: doesn't work for usage with View.ScreenToWorld, see SvPositionToScreenPosition2()
float4 SvPositionToScreenPosition(float4 SvPosition)
{
	// todo: is already in .w or needs to be reconstructed like this:
//	SvPosition.w = ConvertFromDeviceZ(SvPosition.z);

	float2 PixelPos = SvPosition.xy - View.ViewRectMin.xy;	

	// NDC (NormalizedDeviceCoordinates, after the perspective divide)
	float3 NDCPos = float3( (PixelPos * View.ViewSizeAndInvSize.zw - 0.5) * float2(2, 2/*-2*/), SvPosition.z);

	// SvPosition.w: so .w has the SceneDepth, some mobile code and the DepthFade material expression wants that
	return float4(NDCPos.xyz, 1) * SvPosition.w;
}