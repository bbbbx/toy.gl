import * as ToyGL from '../../../src/index.js';
const { Cartesian2, Cartesian3, Cartesian4, Matrix4 } = ToyGL;
import SkyAtmosphereComponent from './SkyAtmosphereComponent.mjs';
import AtmosphereSetup from './AtmosphereSetup.mjs';
import SkyAtmosphereShaderDefinition from './SkyAtmosphereShaderDefinition.mjs';
import ViewInfo from './ViewInfo.mjs';
import ViewMatrices from './ViewMatrices.mjs';
import defaultValue from '../../../src/defaultValue.js';

const FastMathGLSL = await fetch('./Shaders/FastMath.glsl').then(res => res.text());
const BuiltinGLSL = await fetch('./Shaders/Builtin.glsl').then(res => res.text());
const CommonFrag = await fetch('./Shaders/Common.frag').then(res => res.text());
const SkyAtmosphereCommonFrag = await fetch('./Shaders/SkyAtmosphereCommon.frag').then(res => res.text());
const RenderTransmittanceLutCSFrag = await fetch('./Shaders/RenderTransmittanceLutCS.frag').then(res => res.text());
const RenderMultiScatteredLuminanceLutCSFrag = await fetch('./Shaders/RenderMultiScatteredLuminanceLutCS.frag').then(res => res.text());
const RenderSkyViewLutCSFrag = await fetch('./Shaders/RenderSkyViewLutCS.frag').then(res => res.text());
const RenderSkyAtmosphereRayMarchingPSFrag = await fetch('./Shaders/RenderSkyAtmosphereRayMarchingPS.frag').then(res => res.text());
const SkyAtmosphereVSVert = await fetch('./Shaders/SkyAtmosphereVS.vert').then(res => res.text());

const ScreenPassVertexShaderSource = `
attribute vec2 a_position;
varying vec2 vUV;
void main() {
  gl_Position = vec4(a_position, 0, 1);
  vUV = a_position*0.5 + 0.5;
}
`;

let screenVAO;
const screenProgramAttribLocation = {
  a_position: 0,
};

function createScreenVAO(gl) {
  return ToyGL.createVAO(gl, {
    attributes: {
      a_position: {
        location: 0,
        size: 2,
        data: [
          -1, -1,
          1, -1,
          -1, 1,
          1, 1,
        ],
      },
    },
    indices: [0, 1, 2, 1, 3, 2],
  });
}


/**
 * 
 * @param {Object} options 
 * @param {WebGLRenderingContext} options.gl
 * @param {Array.<Number>} options.viewport
 * @param {String} options.fragmentShaderSource
 * @param {String} [options.vertexShaderSource]
 * @param {Object} [options.uniforms]
 * @param {WebGLFramebuffer} [options.framebuffer]
 */
function AddScreenPass(options) {
  const gl = options.gl;
  const framebuffer = options.framebuffer;
  const viewport = options.viewport;
  const vertexShaderSource = defaultValue(options.vertexShaderSource, ScreenPassVertexShaderSource);
  const fragmentShaderSource = options.fragmentShaderSource;
  const uniforms = options.uniforms;

  if (!screenVAO) screenVAO = createScreenVAO(gl);

  ToyGL.setState(gl, {
    viewport: viewport,
    blend: {
      enable: false,
    },
  });
  ToyGL.clear(gl, {
    color: [0, 0, 0, 0],
    depth: 1,
    
  });
  ToyGL.draw(gl, {
    vs: vertexShaderSource,
    fs: fragmentShaderSource,
    attributeLocations: screenProgramAttribLocation,
    vao: screenVAO,
    count: 6,
    uniforms: uniforms,
    fb: framebuffer,
  });
}

function createFramebuffer(gl, colorTexture) {
  return ToyGL.createFramebuffer(gl, {
    colorTexture: colorTexture,
  });
}

function createRGBA32FTexture(gl, width, height) {
  return ToyGL.createTexture(gl, {
    width: width,
    height: height,
    data: null,
    internalFormat: gl.RGBA,
    format: gl.RGBA,
    type: gl.FLOAT,
    minFilter: gl.LINEAR,
    magFilter: gl.LINEAR,
  });
}

function GetSizeAndInvSize(Width, Height) {
  return new Cartesian4(Width, Height, 1.0 / Width, 1.0 / Height);
}

const SampleCountMin = 2; //CVarSkyAtmosphereSampleCountMin
const SampleCountMax = 16;//CVarSkyAtmosphereSampleCountMax

const TransmittanceLutWidth = 256;
const TransmittanceLutHeight = 64;
const TransmittanceSampleCount = 10;//CVarSkyAtmosphereTranstmittanceLUTSampleCount
let TransmittanceLutTexture;

const MultiScatteredLuminanceLutWidth = 200; //CVarSkyAtmosphereMultiScatteringLUTWidth
const MultiScatteredLuminanceLutHeight = 200;//CVarSkyAtmosphereMultiScatteringLUTHeight
const MultiScatteringSampleCount = 15;//CVarSkyAtmosphereMultiScatteringLUTSampleCount
let MultiScatteredLuminanceLutTexture;

// 1x1
let DistantSkyLightLutTexture;

const SkyViewLutWidth = 200; //CVarSkyAtmosphereFastSkyLUTWidth
const SkyViewLutHeight = 200;// CVarSkyAtmosphereFastSkyLUTHeight
let SkyViewLutTexture;
const FastSkySampleCountMin = 4;  //CVarSkyAtmosphereFastSkyLUTSampleCountMin
const FastSkySampleCountMax = 32;  //CVarSkyAtmosphereFastSkyLUTSampleCountMax
const FastSkyDistanceToSampleCountMaxInv = 1. / 150;//CVarSkyAtmosphereFastSkyLUTDistanceToSampleCountMax

function InitSkyAtmosphereForViews(gl) {
  TransmittanceLutTexture = createRGBA32FTexture(gl, TransmittanceLutWidth, TransmittanceLutHeight);
  MultiScatteredLuminanceLutTexture = createRGBA32FTexture(gl, MultiScatteredLuminanceLutWidth, MultiScatteredLuminanceLutHeight);
  DistantSkyLightLutTexture = createRGBA32FTexture(gl, 1, 1);

  // SkyAtmosphereViewLutTexture
  SkyViewLutTexture = createRGBA32FTexture(gl, SkyViewLutWidth, SkyViewLutHeight);
  // SkyAtmosphereCameraAerialPerspectiveVolume
}


const skyAtmosphereComponent = new SkyAtmosphereComponent();
const atmosphereSetup = new AtmosphereSetup(skyAtmosphereComponent);
// console.log(skyAtmosphereComponent);
// console.log(atmosphereSetup.BottomRadiusKm);
const view = new ViewInfo();
const InViewMatrices = new ViewMatrices();
const eye = new Cartesian3(0, 0, 2 * AtmosphereSetup.SkyUnitToCm);
const eyeDir = new Cartesian3(0, 1, 0);
Cartesian3.normalize(eyeDir, eyeDir);
const eyeRight = new Cartesian3(1, 0, 0);
const eyeUp = Cartesian3.cross(eyeRight, eyeDir, new Cartesian3());
Matrix4
  .computeView(eye, eyeDir, eyeUp, eyeRight, new Matrix4())
  .clone(InViewMatrices.ViewMatrix);

const fovY = 45 / 180 * Math.PI;
const aspectRatio = window.innerWidth / window.innerHeight;
const near = 1;
const far = 1000;
Matrix4
  .computePerspectiveFieldOfView(fovY, aspectRatio, near, far, new Matrix4())
  .clone(InViewMatrices.ProjectionMatrix);
InViewMatrices.RecomputeDerivedMatrices();
console.log(InViewMatrices.ViewProjectionMatrix);


const planetCenter = new Cartesian3(0, 0, -atmosphereSetup.BottomRadiusKm * AtmosphereSetup.SkyUnitToCm);

const uniforms = {
  'SkyAtmosphere.TransmittanceLutSizeAndInvSize': GetSizeAndInvSize(TransmittanceLutWidth, TransmittanceLutHeight),
  'SkyAtmosphere.TransmittanceSampleCount': TransmittanceSampleCount, //CVarSkyAtmosphereTranstmittanceLUTSampleCount
  'SkyAtmosphere.MultiScatteredLuminanceLutSizeAndInvSize': GetSizeAndInvSize(MultiScatteredLuminanceLutWidth, MultiScatteredLuminanceLutHeight),
  'SkyAtmosphere.MultiScatteringSampleCount': MultiScatteringSampleCount, //r.SkyAtmosphere.MultiScatteringLUT.SampleCount
  'SkyAtmosphere.SkyViewLutSizeAndInvSize': GetSizeAndInvSize(SkyViewLutWidth, SkyViewLutHeight),
  'SkyAtmosphere.FastSkySampleCountMin': FastSkySampleCountMin,
  'SkyAtmosphere.FastSkySampleCountMax': FastSkySampleCountMax,
  'SkyAtmosphere.FastSkyDistanceToSampleCountMaxInv': FastSkyDistanceToSampleCountMaxInv,

  'SkyAtmosphere.SampleCountMin': 2,  // CVarSkyAtmosphereSampleCountMin
  'SkyAtmosphere.SampleCountMax': 16, // CVarSkyAtmosphereSampleCountMax
  'SkyAtmosphere.DistanceToSampleCountMaxInv': 1 / 150, // CVarSkyAtmosphereSampleCountMax
  'SkyAtmosphere.SkyLuminanceFactor': skyAtmosphereComponent.SkyLuminanceFactor, // CVarSkyAtmosphereSampleCountMax



  'Atmosphere.MultiScatteringFactor': atmosphereSetup.MultiScatteringFactor,
  'Atmosphere.BottomRadiusKm': atmosphereSetup.BottomRadiusKm,
  'Atmosphere.TopRadiusKm': atmosphereSetup.TopRadiusKm,
  'Atmosphere.RayleighDensityExpScale': atmosphereSetup.RayleighDensityExpScale,
  'Atmosphere.RayleighScattering': atmosphereSetup.RayleighScattering,
  'Atmosphere.MieScattering': atmosphereSetup.MieScattering,
  'Atmosphere.MieDensityExpScale': atmosphereSetup.MieDensityExpScale,
  'Atmosphere.MieExtinction': atmosphereSetup.MieExtinction,
  'Atmosphere.MiePhaseG': atmosphereSetup.MiePhaseG,
  'Atmosphere.MieAbsorption': atmosphereSetup.MieAbsorption,
  'Atmosphere.AbsorptionDensity0LayerWidth': atmosphereSetup.AbsorptionDensity0LayerWidth,
  'Atmosphere.AbsorptionDensity0LinearTerm': atmosphereSetup.AbsorptionDensity0LinearTerm,
  'Atmosphere.AbsorptionDensity1LinearTerm': atmosphereSetup.AbsorptionDensity1LinearTerm,
  'Atmosphere.AbsorptionDensity0ConstantTerm': atmosphereSetup.AbsorptionDensity0ConstantTerm,
  'Atmosphere.AbsorptionDensity1ConstantTerm': atmosphereSetup.AbsorptionDensity1ConstantTerm,
  'Atmosphere.AbsorptionExtinction': atmosphereSetup.AbsorptionExtinction,
  'Atmosphere.GroundAlbedo': atmosphereSetup.GroundAlbedo,


  'View.PreExposure': 1,
  'View.OneOverPreExposure': 1,
  'View.RealTimeReflectionCapture': false,
  'View.RealTimeReflectionCapturePreExposure': 1,
  // InViewMatrices.GetViewOrigin()，单位为 cm
  'View.SkyWorldCameraOrigin': eye,
  // 行星中心点和 ViewHeight(相机位置减去行星中心的模)，单位为 cm
  'View.SkyPlanetCenterAndViewHeight': [
    0,
    0,
    -atmosphereSetup.BottomRadiusKm * AtmosphereSetup.SkyUnitToCm,
    Cartesian3.magnitude(Cartesian3.subtract(eye, planetCenter, new Cartesian3))
  ],
  'View.ViewForward': eyeDir,
  'View.ViewRight': eyeRight,
  'View.ScreenToWorld': InViewMatrices.GetInvViewProjectionMatrix(),
  'View.WorldCameraOrigin': eye,
  'View.AtmosphereLightDirection': [
    0, 0, 1,
    0, 0, -1,
  ],
  'View.AtmosphereLightColor': [
    1 * 50, 1 * 50, 1 * 50, 1,
    0.7, 1, 1, 1,
  ],

  // TODO:
  UniformSphereSamplesBuffer: new Array(64*4).fill(2),
  TransmittanceLutTexture: undefined,
  MultiScatteredLuminanceLutTexture: undefined,
  SkyViewLutTexture: undefined,
};

console.log(uniforms);

/**
 * 
 * @param {WebGLRenderingContext} gl 
 */
function RenderSkyAtmosphereLookUpTables(
  gl,
  // transmittanceLutTexture,
  // multiScatteredLuminanceLutTexture,
  // distantSkyLightLutTexture,
  // skyViewLutTexture, // SkyViewLutTexture
) {
  const transmittanceFramebuffer = createFramebuffer(gl, TransmittanceLutTexture);
  const multiScatteredFramebuffer = createFramebuffer(gl, MultiScatteredLuminanceLutTexture);
  const distantSkyFramebuffer = createFramebuffer(gl, DistantSkyLightLutTexture);
  const skyViewFramebuffer = createFramebuffer(gl, SkyViewLutTexture);

  // inViewMatrices.ViewOrigin = 
  // inViewMatrices.
  // view.SetupUniformBufferParameters(undefined, inViewMatrices, undefined, uniforms);

  // Transmittance LUT
  {
    AddScreenPass({
      gl: gl,
      framebuffer: transmittanceFramebuffer,
      // framebuffer: null,
      viewport: [0, 0, TransmittanceLutWidth, TransmittanceLutHeight],
      fragmentShaderSource: `
precision highp float;
varying vec2 vUV;

${FastMathGLSL}

${SkyAtmosphereShaderDefinition.TransmittancePassShaderDefinition}

${BuiltinGLSL}
${CommonFrag}
${SkyAtmosphereCommonFrag}
${RenderTransmittanceLutCSFrag}

void main() {
  RenderTransmittanceLutCS();
}
      `,
      uniforms: uniforms,
    });
  }

  // Mean Illuminance LUT
  {
    uniforms.TransmittanceLutTexture = TransmittanceLutTexture;
    AddScreenPass({
      gl: gl,
      framebuffer: multiScatteredFramebuffer,
      viewport: [0, 0, SkyViewLutWidth, SkyViewLutHeight],
      fragmentShaderSource: `
precision highp float;
varying vec2 vUV;

${FastMathGLSL}

${SkyAtmosphereShaderDefinition.MultiScattPassShaderDefinition}

${BuiltinGLSL}
${CommonFrag}
${SkyAtmosphereCommonFrag}
${RenderMultiScatteredLuminanceLutCSFrag}

void main() {
  RenderMultiScatteredLuminanceLutCS();
}
      `,
      uniforms: uniforms,
    });
  }

  // Distant Sky Light LUT
  {

  }

  // For each View
  // Sky View LUT
  {
    uniforms.MultiScatteredLuminanceLutTexture = MultiScatteredLuminanceLutTexture;
    AddScreenPass({
      gl: gl,
      framebuffer: skyViewFramebuffer,
      viewport: [0, 0, SkyViewLutWidth, SkyViewLutHeight],
      fragmentShaderSource: `
precision highp float;
varying vec2 vUV;

${FastMathGLSL}

${SkyAtmosphereShaderDefinition.SkyViewPassShaderDefinition}

${BuiltinGLSL}
${CommonFrag}
${SkyAtmosphereCommonFrag}
${RenderSkyViewLutCSFrag}

void main() {
  RenderSkyViewLutCS();
}
      `,
      uniforms: uniforms,
    });
  }
}

const KM_TO_CM = 100000.0;
const CM_TO_KM = 1.0 / KM_TO_CM;

function GetSunOnEarthHalfApexAngleRadian() {
  const SunOnEarthApexAngleDegree = 0.545;  // Apex angle == angular diameter
  return 0.5 * SunOnEarthApexAngleDegree * Math.PI / 180.0;
}

/**
 * 
 * @param {WebGLRenderingContext} gl 
 */
function RenderSkyAtmosphere(gl) {
  // const InternalCommonParameters =  SetupSkyAtmosphereInternalCommonParameters();

  // uniform.SkyAtmosphere.
  // FRDGTextureRef SceneColor
  // FRDGTextureRef SceneDepth
  // FRDGTextureRef TransmittanceLut
  // FRDGTextureRef MultiScatteredLuminanceLut

  // FRDGTextureRef SkyAtmosphereViewLutTexture
  // FRDGTextureRef SkyAtmosphereCameraAerialPerspectiveVolume


  // 不是 RelfectionCaputre 则渲染 source light disk
  // const bLightDiskEnabled = !View.bIsReflectionCapture;
  const bLightDiskEnabled = true;
  const bRenderSkyPixel = false;
  const bFastAerialPerspectiveDepthTest = true;
  const ViewOrigin = eye;
  const PlanetCenter = Cartesian3.multiplyByScalar(atmosphereSetup.PlanetCenterKm, KM_TO_CM, new Cartesian3());
  const TopOfAtmosphere = Cartesian3.multiplyByScalar(atmosphereSetup.TopRadiusKm, KM_TO_CM, new Cartesian3());
  const SafeEdge = 1000.0;  // 10 meters
  // 相机位于大气外，强制 ray marching
  // 则 FASTSKY_ENABLED 或 FASTAERIALPERSPECTIVE_ENABLED 为 false
  const ForceRayMarching = (Cartesian3.distance(ViewOrigin, PlanetCenter) - TopOfAtmosphere - SafeEdge) > 0.0;

  {
    uniforms.SkyViewLutTexture = SkyViewLutTexture;
    const StartDepthZ = 0.1;
    if (bFastAerialPerspectiveDepthTest) {
      // const ProjectionMatrix = View.ViewMatrices.GetProjectionMatrix();
      // const HalfHorizontalFOV = Math.atan(1.0 / ProjectionMatrix[0]/*[0][0]*/);
      // const HalfVerticalFOV = Math.atan(1.0 / ProjectionMatrix[5]/*[1][1]*/);
      // const StartDepthViewCm = Math.cos(Math.max(HalfHorizontalFOV, HalfVerticalFOV)) * AerialPerspectiveStartDepthInCm;
      // const Projected = Matrix4.multiplyByVector(ProjectionMatrix, new Cartesian4(0, 0, StartDepthViewCm, 1), new Cartesian4());
      // StartDepthZ = Projected.z / Projected.w;
    }
    uniforms.StartDepthZ = StartDepthZ;

    const EffectiveBufferSize = new Cartesian2(Math.max(gl.drawingBufferWidth, 1), Math.max(gl.drawingBufferHeight, 1));
    const EffectiveViewRect = {
      Min: new Cartesian2(0, 0),
      Max: new Cartesian2(gl.drawingBufferWidth, gl.drawingBufferHeight),
    };
    uniforms['View.BufferSizeAndInvSize'] = GetSizeAndInvSize(EffectiveBufferSize.x, EffectiveBufferSize.y);
    uniforms['View.ViewRectMin'] = new Cartesian4(EffectiveViewRect.Min.x, EffectiveViewRect.Min.y, 0, 0);
    uniforms['View.ViewSizeAndInvSize'] = GetSizeAndInvSize(EffectiveViewRect.Max.x - EffectiveViewRect.Min.x, EffectiveViewRect.Max.y - EffectiveViewRect.Min.y);
    uniforms['View.RenderingReflectionCaptureMask'] = 0.0;
    uniforms['View.AtmosphereLightDiscCosHalfApexAngle'] = [
      GetSunOnEarthHalfApexAngleRadian(), GetSunOnEarthHalfApexAngleRadian(), GetSunOnEarthHalfApexAngleRadian(), GetSunOnEarthHalfApexAngleRadian(),
      GetSunOnEarthHalfApexAngleRadian(), GetSunOnEarthHalfApexAngleRadian(), GetSunOnEarthHalfApexAngleRadian(), GetSunOnEarthHalfApexAngleRadian(),
    ];
    uniforms['View.AtmosphereLightDiscLuminance'] = [
      5, 5, 5, 1,
      0.1, 0.1, 0.1, 1,
    ];

    const fragmentShaderSource = `
precision highp float;
varying vec2 vUV;

${FastMathGLSL}

${SkyAtmosphereShaderDefinition.RenderSkyAtmospherePassShaderDefinition}

${BuiltinGLSL}
${CommonFrag}
${SkyAtmosphereCommonFrag}
${RenderSkyAtmosphereRayMarchingPSFrag}

void main() {
  RenderSkyAtmosphereRayMarchingPS();
}
    `;

    AddScreenPass({
      gl: gl,
      framebuffer: null,
      viewport: [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight],
      vertexShaderSource: `
        ${SkyAtmosphereVSVert}
      `,
      fragmentShaderSource: fragmentShaderSource,
      uniforms: uniforms,
    });
  }

}

export {
  InitSkyAtmosphereForViews,
  RenderSkyAtmosphereLookUpTables,
  RenderSkyAtmosphere,
};