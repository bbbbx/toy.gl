#include <vector>
#include <iostream>
#include <fstream>
#include <math.h>

#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "stb_image_write.h"

template<typename T>
class Cartesian2
{
public:
    T x;
    T y;
    Cartesian2(T x, T y) : x(x), y(y) {}
};

template<typename T>
class Cartesian4
{
public:
    T x;
    T y;
    T z;
    T w;
    Cartesian4() : Cartesian4(0.0, 0.0, 0.0, 0.0) {}
    Cartesian4(T x, T y, T z, T w) : x(x), y(y), z(z), w(w) {}
};

template<typename T>
class Matrix4
{
public:
    T *m = new T[16];
    Matrix4(
        T column0Row0,
        T column1Row0,
        T column2Row0,
        T column3Row0,
        T column0Row1,
        T column1Row1,
        T column2Row1,
        T column3Row1,
        T column0Row2,
        T column1Row2,
        T column2Row2,
        T column3Row2,
        T column0Row3,
        T column1Row3,
        T column2Row3,
        T column3Row3
    )
    {
        m[0] = column0Row0;
        m[1] = column0Row1;
        m[2] = column0Row2;
        m[3] = column0Row3;
        m[4] = column1Row0;
        m[5] = column1Row1;
        m[6] = column1Row2;
        m[7] = column1Row3;
        m[8] = column2Row0;
        m[9] = column2Row1;
        m[10] = column2Row2;
        m[11] = column2Row3;
        m[12] = column3Row0;
        m[13] = column3Row1;
        m[14] = column3Row2;
        m[15] = column3Row3;
    }
    ~Matrix4() { delete [] m; }

    static Cartesian4<T>* multiplyByVector(const Matrix4<T>* matrix, const Cartesian4<T>* cartesian, Cartesian4<T>* result)
    {
        T vX = cartesian->x;
        T vY = cartesian->y;
        T vZ = cartesian->z;
        T vW = cartesian->w;

        T x = matrix->m[0] * vX + matrix->m[4] * vY + matrix->m[8] * vZ + matrix->m[12] * vW;
        T y = matrix->m[1] * vX + matrix->m[5] * vY + matrix->m[9] * vZ + matrix->m[13] * vW;
        T z = matrix->m[2] * vX + matrix->m[6] * vY + matrix->m[10] * vZ + matrix->m[14] * vW;
        T w = matrix->m[3] * vX + matrix->m[7] * vY + matrix->m[11] * vZ + matrix->m[15] * vW;

        result->x = x;
        result->y = y;
        result->z = z;
        result->w = w;
        return result;
    }
};

float reverseLogDepth(float logZ, float near, float far, float log2FarDepthFromNearPlusOne)
{
    float log2Depth = logZ * log2FarDepthFromNearPlusOne;
    float depthFromNear = std::pow((float)2.0, (float)log2Depth) - (float)1.0;
    return far * ((float)1.0 - near / (depthFromNear + near)) / (far - near);
}


template<typename T>
Cartesian4<T> clipToEye(const Cartesian2<float>* uv, T depth, const Matrix4<T>* inverseProjection) {
    Cartesian4<T> NDC(
        (T)uv->x * (T)2.0 - (T)1.0,
        (T)uv->y * (T)2.0 - (T)1.0,
        (T)depth * (T)2.0 - (T)1.0,
        (T)1.0
    );
    Cartesian4<T> posEC;
    Matrix4<T>::multiplyByVector(inverseProjection, &NDC, &posEC);
    posEC.x = posEC.x / posEC.w;
    posEC.y = posEC.y / posEC.w;
    posEC.z = posEC.z / posEC.w;
    posEC.w = posEC.w / posEC.w;
    return posEC;
}

template<typename T>
std::vector<char> Exe(
    std::vector<float> depthList,
    T near,
    T far,
    T farDepthFromNear,
    T uFarDepthFromNearPlusOne,
    T uLog2FarDepthFromNearPlusOne,
    const Matrix4<T> *inverseProjectionMatrix,
    int width,
    int height
)
{
    std::vector<char> pixels;

    for (int y = height - 1; y >= 0; y--)
    {
        for (int x = 0; x < width; x++)
        {
            int i = y * width + x;
            T depth = depthList[i];

            T deviceZ = reverseLogDepth((float)depth, (float)near, (float)far, (float)uLog2FarDepthFromNearPlusOne);

            if ((T)deviceZ >= (T)0.9999999) {
                pixels.push_back(255);
                pixels.push_back(0);
                pixels.push_back(255);
                pixels.push_back(255);

                continue;
            }

            Cartesian2<float> uv(
                ((float)x + (float)0.5) / (float)width,
                ((float)y + (float)0.5) / (float)height
            );
            // 用 (float)deviceZ 就有问题
            // 因为远处相邻的 deviceZ 差别小于 float 的精度？
            Cartesian4<T> _shadingPointEC = clipToEye<T>(&uv, (T)deviceZ, inverseProjectionMatrix);
            Cartesian4<float> shadingPointEC;

            float M_TO_KM = 0.001;
            shadingPointEC.x = _shadingPointEC.x * M_TO_KM;
            shadingPointEC.y = _shadingPointEC.y * M_TO_KM;
            shadingPointEC.z = _shadingPointEC.z * M_TO_KM;

            float magnitudeSquared =
                shadingPointEC.x * shadingPointEC.x +
                shadingPointEC.y * shadingPointEC.y +
                shadingPointEC.z * shadingPointEC.z;
            float magnitude = std::sqrt(magnitudeSquared);
            float t = std::max((float)0.0, std::min((float)1.0, magnitude / (float)26.0));
            // t = -shadingPointEC.z / 6.0;

            pixels.push_back((char)(t * 255));
            pixels.push_back((char)(t * 255));
            pixels.push_back((char)(t * 255));
            pixels.push_back(255);
        }
    }

    return pixels;
}

int main() {
    // float f = -1.24737E-06 + 1.0;
    // f = -0.1 + 8159891.0; 还是 8159891!
    // f = 496.5 * 0.00162;
    // f = 1265.5 * 0.00053;
    // f = 8159891 - 0.1;
    // printf("%f\n", f);

    std::fstream file("depth_1920x969.f32", std::ios::in | std::ios::binary);
    if (!file.is_open())
    {
        std::cout << "Failed to open file\n";
        return -1;
    }

    int width = 1920;
    int height = 969;
    std::vector<float> depthList(width * height);
    file.read(reinterpret_cast<char*>(depthList.data()), sizeof(float) * width * height);
    file.close();

    double near = 0.1;
    double far = 8159891.0;
    double farDepthFromNear = 8159890.9;
    double uFarDepthFromNearPlusOne = 8159891.9;
    double uLog2FarDepthFromNearPlusOne = 22.960118609221073;
    Matrix4<double> inverseProjectionMatrix(
        0.5773502691896256, 0.0, 0.0, 0.0,
        0.0, 0.29138146398163917, 0.0, 0.0,
        0.0, 0.0, 0.0, -0.9999999999999999,
        0.0, 0.0, -4.999999938724671, 5.000000061275326
    );

    printf("%.8f\n", (double)5.000000061275326);

    {
        auto pixels = Exe<double>(
            depthList,
            near,
            far,
            farDepthFromNear,
            uFarDepthFromNearPlusOne,
            uLog2FarDepthFromNearPlusOne,
            &inverseProjectionMatrix,
            width,
            height
        );
        stbi_write_png("a_double.png", width, height, 4, (void*)(pixels.data()), width * 4);
    }
    {

        float _near = near;
        float _far = far;
        float _farDepthFromNear = 8159890.9;
        float _uFarDepthFromNearPlusOne = uFarDepthFromNearPlusOne;
        float _uLog2FarDepthFromNearPlusOne = uLog2FarDepthFromNearPlusOne;
        Matrix4<float> _inverseProjectionMatrix(
            inverseProjectionMatrix.m[0], inverseProjectionMatrix.m[4], inverseProjectionMatrix.m[8], inverseProjectionMatrix.m[12],
            inverseProjectionMatrix.m[1], inverseProjectionMatrix.m[5], inverseProjectionMatrix.m[9], inverseProjectionMatrix.m[13],
            inverseProjectionMatrix.m[2], inverseProjectionMatrix.m[6], inverseProjectionMatrix.m[10], inverseProjectionMatrix.m[14],
            inverseProjectionMatrix.m[3], inverseProjectionMatrix.m[7], inverseProjectionMatrix.m[11], inverseProjectionMatrix.m[15]
        );
        auto pixels = Exe<float>(
            depthList,
            _near,
            _far,
            _farDepthFromNear,
            _uFarDepthFromNearPlusOne,
            _uLog2FarDepthFromNearPlusOne,
            &_inverseProjectionMatrix,
            width,
            height
        );
        stbi_write_png("a_float.png", width, height, 4, (void*)(pixels.data()), width * 4);
    }
    // return 0;

    // std::vector<float> tList(width * height);
    // std::vector<char> pixels;

    // for (size_t y = 0; y < height; y++)
    // {
    //     for (size_t x = 0; x < width; x++)
    //     {
    //         int i = y * width + x;
    //         float depth = depthList[i];

    //         float deviceZ = reverseLogDepth(depth, near, far, uLog2FarDepthFromNearPlusOne);

    //         if (deviceZ >= 0.9999999) {
    //             pixels.push_back(255);
    //             pixels.push_back(0);
    //             pixels.push_back(255);
    //             pixels.push_back(255);

    //             tList.push_back(-33333.0);
    //             continue;
    //         }

    //         Cartesian2<float> uv(
    //             (x + 0.5) / width,
    //             (y + 0.5) / height
    //         );
    //         Cartesian4<float> shadingPointEC = clipToEye(&uv, deviceZ, &inverseProjectionMatrix);

    //         float M_TO_KM = 0.001;
    //         shadingPointEC.x = shadingPointEC.x * M_TO_KM;
    //         shadingPointEC.y = shadingPointEC.y * M_TO_KM;
    //         shadingPointEC.z = shadingPointEC.z * M_TO_KM;

    //         float magnitudeSquared =
    //             shadingPointEC.x * shadingPointEC.x +
    //             shadingPointEC.y * shadingPointEC.y +
    //             shadingPointEC.z * shadingPointEC.z;
    //         float magnitude = std::sqrt(magnitudeSquared);
    //         float t = std::max(0.0, std::min(1.0, magnitude / 96.0));
    //         tList.push_back(t);

    //         pixels.push_back((char)(t * 255));
    //         pixels.push_back((char)(t * 255));
    //         pixels.push_back((char)(t * 255));
    //         pixels.push_back(255);
    //     }

    // }

    // stbi_write_png("a.png", width, height, 4, (void*)(pixels.data()), width * 4);

    // return 0;
}
// {
//     "0": 0.9006336159432485,
//     "1": 0,
//     "2": 0,
//     "3": 0,
//     "4": 0,
//     "5": 0.2913814639816392,
//     "6": 0,
//     "7": 0,
//     "8": 0,
//     "9": 0,
//     "10": 0,
//     "11": -4.999999938724672,
//     "12": 0,
//     "13": 0,
//     "14": -1,
//     "15": 5.000000061275326
// }