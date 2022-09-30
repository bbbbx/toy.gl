#define lerp mix
float saturate(float a) { return clamp(a, 0., 1.); }
vec2  saturate(vec2 a)  { return clamp(a, vec2(0.), vec2(1.)); }
vec3  saturate(vec3 a)  { return clamp(a, vec3(0.), vec3(1.)); }

#define uint int
#define float2 vec2
#define float3 vec3
#define float4 vec4
#define float3x3 mat3
#define float4x4 mat4

float3x3 transpose(float3x3 I) {
    float3x3 O;

    O[0][0] = I[0][0];
    O[0][1] = I[1][0];
    O[0][2] = I[2][0];

    O[1][0] = I[0][1];
    O[1][1] = I[1][1];
    O[1][2] = I[2][1];

    O[2][0] = I[0][2];
    O[2][1] = I[1][2];
    O[2][2] = I[2][2];
    return O;
}


float3x3 mul(float3x3 A, float3x3 B) {
    return B * A;
}
float3 mul(float3x3 M, float3 v) {
    return v * M;
}
float3 mul(float3 v, float3x3 M) {
    return M * v;
}
float4 mul(float4 v, float4x4 M) {
    return M * v;
}
