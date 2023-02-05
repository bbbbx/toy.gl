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
} from '../../dist/toygl.esm.js';
import '../ThirdParty/primitives.js';

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
    depth: false,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: true,
    preserveDrawingBuffer: false,
  },
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
});
const framebuffer = new Framebuffer({
  context: context,
  colorTextures: [ colorTexture ],
  depthTexture: depthTexture,
});
window.depthTexture = depthTexture

const cube = primitives.createCubeVertices(2);

const attributes = [
  {
    index                  : 0,
    enabled                : true,
    vertexBuffer           : Buffer.createVertexBuffer({
      context: context,
      typedArray: cube.position,
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
      typedArray: cube.normal,
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
  indexDatatype: ComponentDatatype.UNSIGNED_SHORT,
  typedArray: cube.indices,
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
  color: new Color(0, 0, 0, 1),
  depth: 1,
});

const passThroughShaderProgram = ShaderProgram.fromCache({
  context: context,
  attributeLocations: {
    aPosition: 0,
    aUv: 1,
  },
  vertexShaderSource: /* glsl */`
    attribute vec2 aPosition;
    attribute vec2 aUv;
    varying vec2 vUv;
    void main() {
      gl_Position = vec4(aPosition, 0, 1);
      vUv = aUv;
    }
  `,
  fragmentShaderSource: /* glsl */`
    precision highp float;
    uniform sampler2D uColorTexture;
    uniform sampler2D uDepthTexture;
    uniform vec2 uCurrentFrustum;
    uniform mat4 uProjectionToView;
    varying vec2 vUv;
    void main() {
      vec2 UV = vUv;
      float depth = texture2D(uDepthTexture, UV).r;
      vec4 ndc = vec4(vec3(UV, depth) * 2.0 - 1.0, 1.0);
      vec4 posEC = uProjectionToView * ndc;
      posEC = posEC / posEC.w;

      float near = uCurrentFrustum.x;
      float far = uCurrentFrustum.y;
      float t = (length(posEC) - near) / (far - near);

      gl_FragColor = vec4(t, t, t, 1);
      // gl_FragColor = texture2D(uColorTexture, UV);
    }
  `,
});

const shaderProgram = ShaderProgram.fromCache({
  context: context,
  attributeLocations: {
    aPosition: 0,
    aNormal: 1,
  },
  vertexShaderSource: /* glsl */`
    attribute vec3 aPosition;
    attribute vec3 aNormal;
    uniform float uTime;
    uniform mat4 uModel;
    uniform mat4 uView;
    uniform mat4 uProjection;
    uniform float uBehind;
    varying vec3 vNormal;
    void main() {
      gl_Position = vec4(aPosition, 1);
      gl_Position.xyz = mat3(
        cos(uTime), -sin(uTime), 0.0,
        sin(uTime), cos(uTime), 0.0,
        0.0,        0.0,        1.0
      ) * gl_Position.xyz;

      vNormal = normalize(uModel * vec4(aNormal, 0)).xyz;
      // vNormal = normalize(gl_Position.xyz);


      gl_Position = uProjection * uView * uModel * gl_Position;
      if (bool(uBehind)) {
        // gl_Position.z = -19.018018018018015;
        // gl_Position.z = (gl_Position.w) * sign(gl_Position.w);
      }
      // gl_Position = vec4(
      //   0.0,
      //   0.0,
      //   0.0,//-19.018018018018015,
      //   1.0);
    }
  `,
  fragmentShaderSource: /* glsl */`#extension GL_EXT_frag_depth : enable
    precision highp float;
    varying vec3 vNormal;
    uniform float uTime;
    uniform float uBehind;
    void main() {
      gl_FragColor.rgb = vec3(sin(uTime) * 0.5 + 0.5);
      gl_FragColor.rgb = vNormal * 0.5 + 0.5;
      // gl_FragColor.rgb = vec3(gl_FragCoord.z);
      gl_FragColor.a = 1.0;

      vec3 normal = normalize(vNormal);
      if (uBehind == 1.0) {
        // gl_FragDepthEXT = -19.018018018018015;
        // FIXME: 设置了深度测试就不通过？？？
        // gl_FragDepthEXT = gl_FragCoord.z;// 0.0;
        // gl_FragColor.rgb = vec3(dot(normal, normalize(vec3(1, 1, 1))));
        // gl_FragColor.rgb = normal * 0.5 + 0.5;
        // gl_FragColor.rgb = vec3(0, 0, 1);
        // gl_FragDepthEXT = -1.0;
        // gl_FragDepthEXT = 0.9999;
        // gl_FragDepthEXT = gl_FragCoord.z;
      } else {
        gl_FragDepthEXT = gl_FragCoord.z;
      }
    }
  `,
});
const fovy = 60 / 180 * Math.PI;
const near = 2;
const far = 100.0;
const projectionMatrix = Matrix4.computePerspectiveFieldOfView(
  fovy,
  context.drawingBufferWidth / context.drawingBufferHeight,
  near,
  far
);
const inverseProjectionMatrix = Matrix4.inverse(projectionMatrix);
const cameraPosition = new Cartesian3(0, 0, 0);
const cameraDirection = new Cartesian3(0, 1, 0);
const cameraUp = new Cartesian3(0, 0, 1);
const viewMatrix = Matrix4.computeView(cameraPosition, cameraDirection, cameraUp);

const modelMatrix = Matrix4.clone(Matrix4.IDENTITY);

const mvp = Matrix4.clone(Matrix4.IDENTITY);
const p = new Cartesian4(0, 0.01, -10, 1);
Matrix4.multiply(viewMatrix, modelMatrix, mvp);
Matrix4.multiply(projectionMatrix, mvp, mvp);
Matrix4.multiplyByVector(mvp, p, p);
Cartesian4.multiplyByUniformScale(p, 1.0 / p.w, p);

let behind = 0;

console.log(p);
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
  uniformMap: {
    uCurrentFrustum: () => new Cartesian2(near, far),
    uProjectionToView: () => inverseProjectionMatrix,
    uTime: () => performance.now() / 1000.0,
    uModel: () => modelMatrix,
    uView: () => viewMatrix,
    uProjection: () => projectionMatrix,
    uBehind: () => behind,
    uColorTexture: () => colorTexture,
    uDepthTexture: () => depthTexture,
  },
});

window.drawCommand = drawCommand
window.context = context
function render() {
  clearCommand.framebuffer = framebuffer;
  clearCommand.execute(context);

  drawCommand._vertexArray = va;
  drawCommand._shaderProgram = shaderProgram;
  drawCommand._framebuffer = framebuffer;

  behind = 0;
  modelMatrix[12] = 0;
  modelMatrix[13] = 21.5;
  modelMatrix[14] = 0.0;
  drawCommand.execute(context);

  behind = 1;
  modelMatrix[12] = 0;
  modelMatrix[13] = 5.2;
  modelMatrix[14] = -1.1;
  drawCommand.execute(context);

  // 
  clearCommand.framebuffer = undefined;
  clearCommand.execute(context);
  drawCommand._vertexArray = viewportQuadVertexArray;
  drawCommand._shaderProgram = passThroughShaderProgram;
  drawCommand._framebuffer = undefined;
  drawCommand.execute(context);
}

function renderScene() {
  try {
    render();
    requestAnimationFrame(renderScene);
  } catch (error) {
    throw error;
  }
}

requestAnimationFrame(renderScene)
