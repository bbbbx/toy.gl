import {
  Context,
  ClearCommand,
  Color,
  ComponentDatatype,
  Buffer,
  BufferUsage,
  VertexArray,
  ShaderProgram,
  RenderState,
  DrawCommand,
  DepthFunction,
  Texture,
  Framebuffer,
  PixelFormat,
  PixelDatatype,

  Matrix4,
  Cartesian4,
  Cartesian3,
  Cartesian2,
  IndexDatatype,
// } from '../../dist/toygl.esm.js';
} from '../../lib/index';
import '../ThirdParty/primitives.js';
window['Matrix4'] = Matrix4;

import VertexLogDepthVert from './shaders/vertexLogDepth.vert';
import WriteLogDepthFrag from './shaders/writeLogDepth.frag';
import ReverseLogDepthFrag from './shaders/reverseLogDepth.frag';
import ReadDepthFrag from './shaders/readDepth.frag';
import MeshVert from './shaders/Mesh.vert';
import MeshFrag from './shaders/Mesh.frag';
import VisualizeVert from './shaders/Visualize.vert';
import VisualizeFrag from './shaders/Visualize.frag';
import Sampler from '../../lib/renderer/Sampler';

window['Context'] = Context;

function configureCanvasSize(widget) {
  const canvas = widget._canvas;
  let width = canvas.clientWidth;
  let height = canvas.clientHeight;
  const pixelRatio = 1.0;// configurePixelRatio(widget);

  widget._canvasClientWidth = width;
  widget._canvasClientHeight = height;

  width *= pixelRatio;
  height *= pixelRatio;

  canvas.width = width;
  canvas.height = height;
}

const container = document.getElementById('container');

const canvas = document.createElement('canvas');
container.appendChild(canvas);

configureCanvasSize({
  _canvas: canvas,
});

const contextOptions = {
  // requestWebgl2: true,
  glContextAttributes: {
    alpha: false,
    antialias: false,
    depth: true,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: true,
    preserveDrawingBuffer: false,
  } as WebGLContextAttributes,
};
const context = new Context(canvas, contextOptions);

const colorTexture = new Texture({
  context: context,
  width: context.drawingBufferWidth,
  height: context.drawingBufferHeight,
  pixelFormat: PixelFormat.RGBA,
  pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
});
const depthTexture = new Texture({
  context: context,
  width: context.drawingBufferWidth,
  height: context.drawingBufferHeight,
  pixelFormat: PixelFormat.DEPTH_COMPONENT,
  pixelDatatype: PixelDatatype.UNSIGNED_INT,
  sampler: Sampler.NEAREST,
});
const framebuffer = new Framebuffer({
  context: context,
  colorTextures: [ colorTexture ],
  depthTexture: depthTexture,
  destroyAttachments: false,
});

const passThroughTexture = new Texture({
  context: context,
  width: context.drawingBufferWidth,
  height: context.drawingBufferHeight,
  pixelFormat: PixelFormat.RGBA,
  pixelDatatype: PixelDatatype.FLOAT,
  sampler: Sampler.NEAREST,
});
const passThroughFramebuffer = new Framebuffer({
  context: context,
  colorTextures: [ passThroughTexture ],
  destroyAttachments: false,
});
window['depthTexture'] = depthTexture

// const cube = window['primitives'].createCubeVertices(20);
const radius = 6378137;
const sphereGeometry = window['primitives'].createSphereVertices(1, 64, 128);

function fromSizeInBytes(sizeInBytes) {
  switch (sizeInBytes) {
    case 2:
      return IndexDatatype.UNSIGNED_SHORT;
    case 4:
      return IndexDatatype.UNSIGNED_INT;
    case 1:
      return IndexDatatype.UNSIGNED_BYTE;
    default:
      throw new Error('Size in bytes cannot be mapped to an IndexDatatype');
  }
}

const attributes = [
  {
    index                  : 0,
    enabled                : true,
    vertexBuffer           : Buffer.createVertexBuffer({
      context: context,
      typedArray: sphereGeometry.position,
      usage: BufferUsage.STATIC_DRAW,
    }),
    componentsPerAttribute : 3,
    componentDatatype      : ComponentDatatype.FLOAT,
    offsetInBytes          : 0,
    strideInBytes          : 0, // tightly packed
    instanceDivisor        : 0, // not instanced
  },
  {
    index                  : 1,
    enabled                : true,
    vertexBuffer           : Buffer.createVertexBuffer({
      context: context,
      typedArray: sphereGeometry.normal,
      usage: BufferUsage.STATIC_DRAW,
    }),
    componentsPerAttribute : 3,
    componentDatatype      : ComponentDatatype.FLOAT,
    offsetInBytes          : 0,
    strideInBytes          : 0,
    instanceDivisor        : 0,
  },
];
const indexBuffer =  Buffer.createIndexBuffer({
  context: context,
  indexDatatype: fromSizeInBytes((sphereGeometry.indices as Uint32Array).BYTES_PER_ELEMENT),
  typedArray: sphereGeometry.indices,
  usage: BufferUsage.STATIC_DRAW,
});
const va = new VertexArray({
  context: context,
  attributes: attributes,
  indexBuffer: indexBuffer,
});

const viewportQuadVertexArray = new VertexArray({
  context: context,
  attributes: [
    {
      index: 0,
      enabled: true,
      vertexBuffer: Buffer.createVertexBuffer({
        context: context,
        typedArray: new Float32Array([
          -1.0, -1.0,
          1.0, -1.0,
          1.0, 1.0,
          -1.0, 1.0
        ]),
        usage: BufferUsage.STATIC_DRAW,
      }),
      componentsPerAttribute: 2,
      componentDatatype: ComponentDatatype.FLOAT,
      offsetInBytes: 0,
      strideInBytes: 0,
      instanceDivisor: 0,
    },
    {
      index: 1,
      enabled: true,
      vertexBuffer: Buffer.createVertexBuffer({
        context: context,
        typedArray: new Float32Array([
          0.0, 0.0,
          1.0, 0.0,
          1.0, 1.0,
          0.0, 1.0
        ]),
        usage: BufferUsage.STATIC_DRAW,
      }),
      componentsPerAttribute: 2,
      componentDatatype: ComponentDatatype.FLOAT,
      offsetInBytes: 0,
      strideInBytes: 0,
      instanceDivisor: 0,
    }
  ],
  indexBuffer: Buffer.createIndexBuffer({
    context: context,
    indexDatatype: ComponentDatatype.UNSIGNED_SHORT,
    typedArray: new Uint16Array([ 0, 1, 2, 0, 2, 3]),
    usage: BufferUsage.STATIC_DRAW,
  }),
});


const clearCommand = new ClearCommand({
  color: new Color(0, 0, 0, 0),
  depth: 1,
});

const visualizeShaderProgram = ShaderProgram.fromCache({
  context: context,
  attributeLocations: {
    aPosition: 0,
    aUV: 1,
  },
  vertexShaderSource: VisualizeVert,
  fragmentShaderSource: `
    precision highp float;
    precision highp sampler2D;

    ${ReverseLogDepthFrag}
    ${ReadDepthFrag}
    ${VisualizeFrag}
  `,
});

const meshShaderProgram = ShaderProgram.fromCache({
  context: context,
  attributeLocations: {
    aPosition: 0,
    aNormal: 1,
  },
  vertexShaderSource: `
    ${VertexLogDepthVert}
    ${MeshVert}
  `,
  fragmentShaderSource: `
    precision highp float;
    #extension GL_EXT_frag_depth : enable

    ${WriteLogDepthFrag}
    ${MeshFrag}
  `,
});
const fovy = 0.5670624925362702;// 60 / 180 * Math.PI;
const near = 0.1;
const far = 8159891;//8159891.135777062;
const aspectRatio = context.drawingBufferWidth / context.drawingBufferHeight;
const projectionMatrix = Matrix4.computePerspectiveFieldOfView(fovy, aspectRatio, near, far);
const inverseProjectionMatrix = Matrix4.inverse(projectionMatrix);
// const cameraPosition = new Cartesian3(0, -radius, -radius);
// const cameraDirection = new Cartesian3(0, 1, 0);
// const cameraUp = new Cartesian3(0, 0, 1);
  // const cameraPosition = new Cartesian3(-2473402.041544917, 5325505.322148577, 2671023.506896153);
  // const cameraDirection = new Cartesian3(0.8601214568544351, 0.18386415713704501, -0.4757993812300392);
  // const cameraUp = new Cartesian3(-0.06435223113724997, 0.9644374608461881, 0.256357512985704);
  // const cameraRight = new Cartesian3(0.506013705156552, -0.18987984578896747, 0.8413654226059543);

  const cameraPosition = new Cartesian3(-3107836.1407957915, 5381180.332917066, 1467881.0705180836);
  const cameraDirection = new Cartesian3(0.9706359223301714, 0.23998790582225818, 0.016483668927294692);
  const cameraUp = new Cartesian3(-0.23664154432878948, 0.9402999811880569, 0.24461546327946124);
  const cameraRight = new Cartesian3(0.04320515918193404, -0.2413332766876415, 0.9694800481615236);
  
const viewMatrix = Matrix4.computeView(cameraPosition, cameraDirection, cameraUp, cameraRight);

const modelMatrix = Matrix4.fromUniformScale(radius);

const modelView = Matrix4.clone(Matrix4.IDENTITY);
const modelViewProjection = Matrix4.clone(Matrix4.IDENTITY);
const p = new Cartesian4(0, 0.1, 0, 1);
Matrix4.multiply(viewMatrix, modelMatrix, modelView);
Matrix4.multiply(projectionMatrix, modelView, modelViewProjection);
Matrix4.multiplyByVector(modelViewProjection, p, p);
// Cartesian4.multiplyByUniformScale(p, 1.0 / p.w, p);
const positionEC = new Cartesian4(0, 0, 0.01, 1);
Matrix4.multiplyByVector(projectionMatrix, positionEC, positionEC);
Cartesian3.multiplyByScalar(positionEC, 1.0 / positionEC.w, positionEC);
console.log(positionEC);

let behind = 0;

const bufferSizeAndInv = new Cartesian4();

const uniformMap = {
  uBufferSizeAndInv: () => bufferSizeAndInv,
  uFarDepthFromNearPlusOne: () => far - near + 1,
  uLog2FarDepthFromNearPlusOne: () => Math.log2(far - near + 1),
  uOneOverLog2FarDepthFromNearPlusOne: () => 1.0 / Math.log2(far - near + 1),
  uCurrentFrustum: () => new Cartesian4(near, far, far - near, far / (far - near)),
  uInverseProjection: () => inverseProjectionMatrix,
  uTime: () => performance.now() / 1000.0,
  uModel: () => modelMatrix,
  uView: () => viewMatrix,
  uProjection: () => projectionMatrix,
  uModelView: () => modelView,
  uModelViewProjection: () => modelViewProjection,
  uBehind: () => behind,
  uColorTexture: () => colorTexture,
  uDepthTexture: () => depthTexture,
  uPassThroughTexture: () => passThroughTexture,
};
window['uniformMap'] = uniformMap;

const passThroughCommand = new DrawCommand({
  vertexArray: viewportQuadVertexArray,
  renderState: RenderState.fromCache({
    cull: {
      enabled: false,
    },
    depthTest: {
      enabled: false,
    },
    depthMask: false,
    viewport: {
      x: 0,
      y: 0,
      width: depthTexture.width,
      height: depthTexture.height,
    }
  }),
  uniformMap: uniformMap,
  shaderProgram: ShaderProgram.fromCache({
    context: context,
    attributeLocations: {
      aPosition: 0,
      aUV: 1,
    },
    vertexShaderSource: VisualizeVert,
    fragmentShaderSource: `
      precision highp float;
  
      varying vec2 vUV;
      uniform sampler2D uPassThroughTexture;

      void main()
      {
        vec2 UV = vUV;
        gl_FragColor = texture2D(uPassThroughTexture, UV);
      }
    `,
  }),
});

const drawCommand = new DrawCommand({
  renderState: RenderState.fromCache({
    cull: {
      enabled: true,
    },
    depthTest: {
      enabled: true,
      func: DepthFunction.LESS
    },
  }),
  uniformMap: uniformMap,
});

window['drawCommand'] = drawCommand
window['context'] = context
function render() {
  clearCommand.framebuffer = framebuffer;
  clearCommand.execute(context);

  drawCommand._vertexArray = va;
  drawCommand._shaderProgram = meshShaderProgram;
  drawCommand._framebuffer = framebuffer;

  // behind = 0;
  // modelMatrix[12] = 0;
  // modelMatrix[13] = 18111.5;
  // modelMatrix[14] = 0.0;
  // drawCommand.execute(context);

  behind = 1;
  // modelMatrix[12] = 0;
  // modelMatrix[13] = radius;
  // modelMatrix[14] = -radius;
  Matrix4.multiply(viewMatrix, modelMatrix, modelView);
  Matrix4.multiply(viewMatrix, modelMatrix, modelViewProjection);
  Matrix4.multiply(projectionMatrix, modelView, modelViewProjection);

  bufferSizeAndInv.x = colorTexture.width;
  bufferSizeAndInv.y = colorTexture.height;
  bufferSizeAndInv.z = 1.0 / bufferSizeAndInv.x;
  bufferSizeAndInv.w = 1.0 / bufferSizeAndInv.y;
  drawCommand.execute(context);

  bufferSizeAndInv.x = context.drawingBufferWidth;
  bufferSizeAndInv.y = context.drawingBufferHeight;
  bufferSizeAndInv.z = 1.0 / bufferSizeAndInv.x;
  bufferSizeAndInv.w = 1.0 / bufferSizeAndInv.y;

  drawCommand._vertexArray = viewportQuadVertexArray;
  drawCommand._shaderProgram = visualizeShaderProgram;
  drawCommand._framebuffer = passThroughFramebuffer;
  drawCommand.execute(context);

  let pixels;
  if (1) {
    const width = passThroughTexture.width;
    const height = passThroughTexture.height;
    pixels = context.readPixels({
      width: width,
      height: height,
      framebuffer: passThroughFramebuffer,
    }) as Float32Array;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    pixels.forEach(element => {
      min = Math.min(element, min);
      max = Math.max(element, max);
    });
    const depths = extractDepthsFromPixels(pixels, width, height);
    console.log(depths[37472]);

    const url = URL.createObjectURL( new Blob([ depths ]) );
    const a = document.createElement('a');
    a.href = url;
    a.download = `depth_${width}x${height}.f32`;
    // a.click();
    URL.revokeObjectURL(url);

    const currentFrustum = uniformMap.uCurrentFrustum();

    const tList = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const depth = depths[i];
        const deviceZ = reverseLogDepth(depth, near, far, uniformMap.uLog2FarDepthFromNearPlusOne());
        if (deviceZ >= 0.9999999) {
          tList.push(Number.NaN);
          continue;
        }

        const uv = new Cartesian2(
          (x + 0.5) / width,
          (y + 0.5) / height
        );
        const shadingPointEC = clipToEye(uv, deviceZ, inverseProjectionMatrix);

        const M_TO_KM = 0.001;
        Cartesian3.multiplyByScalar(shadingPointEC, M_TO_KM, shadingPointEC);
        const t = Math.max(0, Math.min(1, Cartesian3.magnitude(shadingPointEC) / 96.0));
        tList.push(t);
      }
    }

    // const canvas = document.createElement('canvas');
    // canvas.width = width;
    // canvas.height = height;
    // const context2d = canvas.getContext('2d');
    // const uint8ClampedArray = new Uint8ClampedArray(width * height * 4);

    // for (let y = 0; y < height; y++) {
    //   for (let x = 0; x < width; x++) {
    //     const i = y * width + x;
    //     const t = tList[i];
    //     if (Number.isNaN(t)) {
    //       uint8ClampedArray[4 * i + 0] = 255;
    //       uint8ClampedArray[4 * i + 1] = 0;
    //       uint8ClampedArray[4 * i + 2] = 255;
    //       uint8ClampedArray[4 * i + 3] = 255;
    //     } else {
    //       uint8ClampedArray[4 * i + 0] = t * 255;
    //       uint8ClampedArray[4 * i + 1] = t * 255;
    //       uint8ClampedArray[4 * i + 2] = t * 255;
    //       uint8ClampedArray[4 * i + 3] = 255;
    //     }
    //   }
    // }

    // // flip Y
    // const flipYUint8ClampedArray = new Uint8ClampedArray(width * height * 4);
    // for (let y = 0; y < height; y++) {
    //   for (let x = 0; x < width; x++) {
    //     const i = y * width + x;
    //     const inverseY = height - y - 1;
    //     const ii = inverseY * width + x;

    //     flipYUint8ClampedArray[4 * ii + 0] = uint8ClampedArray[4 * i + 0];;
    //     flipYUint8ClampedArray[4 * ii + 1] = uint8ClampedArray[4 * i + 1];;
    //     flipYUint8ClampedArray[4 * ii + 2] = uint8ClampedArray[4 * i + 2];;
    //     flipYUint8ClampedArray[4 * ii + 3] = uint8ClampedArray[4 * i + 3];;
    //   }
    // }

    // const imagedata = new ImageData(flipYUint8ClampedArray, width, height);
    // context2d.putImageData(imagedata, 0, 0);
    // container.appendChild(canvas);
    // // container.removeChild(context._canvas);
    // console.log(pixels, min, max, depths, tList);
  }


  passThroughCommand._framebuffer = undefined;
  passThroughCommand.execute(context);


  // const depthPixels = context.readPixels({
  //   width: colorTexture.width,
  //   height: colorTexture.height,
  //   framebuffer: tmpFramebuffer,
  // }) as Float32Array;

  // console.log(depthPixels.slice(0, 4));

  // if (depthPixels.some((v, i) => v !== pixels[i])) console.warn(1);
}


function renderScene() {
  try {
    render();
    // requestAnimationFrame(renderScene);
  } catch (error) {
    throw error;
  }
}

requestAnimationFrame(renderScene)

function extractDepthsFromPixels(pixels: Float32Array, width: number, height: number): Float32Array {
  const depths = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      depths[i] = pixels[4 * i];
    }
  }
  return depths;
}

function reverseLogDepth(logZ: number, near: number, far: number, log2FarDepthFromNearPlusOne: number): number {
  const log2Depth = logZ * log2FarDepthFromNearPlusOne;
  const depthFromNear = Math.pow(2.0, log2Depth) - 1.0;
  return far * (1.0 - near / (depthFromNear + near)) / (far - near);
}

function clipToEye(uv: Cartesian2, depth: number, inverseProjection: Matrix4): Cartesian3 {
  // inverseProjection = Matrix4.clone(inverseProjection);
  // inverseProjection[11] = -5;
  // inverseProjection[15] = 5;
  const NDC = new Cartesian4(
    uv.x * 2.0 - 1.0,
    uv.y * 2.0 - 1.0,
    depth * 2.0 - 1.0,
    1.0
  );
  const posEC: Cartesian4 = Matrix4.multiplyByVector(inverseProjection, NDC, new Cartesian4());
  Cartesian4.multiplyByUniformScale(posEC, 1.0 / posEC.w, posEC);
  return new Cartesian3(posEC.x, posEC.y, posEC.z);
}