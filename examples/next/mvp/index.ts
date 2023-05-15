import { 
  Buffer,
  BufferUsage,
  Camera,
  Cartesian3,
  ComponentDatatype,
  Context,
  DrawCommand,
  IndexDatatype,
  Matrix3,
  Matrix4,
  OrbitCameraController,
  RenderState,
  ShaderProgram,
  VertexArray,

  BoundingRectangle,
  PassState,

  Model,
  JobScheduler,
  FrameState,
  DeferredRenderer,
  ClearCommand,
  Color,
  Scene,
} from '../../../dist/toygl';
// } from '../../../lib/index';
// import * as ToyGL from '../../../dist/toygl';
// window['ToyGL'] = ToyGL;

const canvas = document.getElementById('containerCanvas') as HTMLCanvasElement;
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const deferredRenderer = new DeferredRenderer(canvas);
window['deferredRenderer'] = deferredRenderer;

const scene = new Scene();
function beforeUpdateScene(deferredRenderer: DeferredRenderer) {
  if (cameraController.autoRotate || cameraController.enableDamping) {
    cameraController.update();
  }

  const ms = performance.now();

  model.modelMatrix[14] = Math.sin(ms * 1e-3);
}
scene.beforeUpdate.addEventListener(beforeUpdateScene);

const camera = new Camera();
camera.position.set(0, 0, 4);
// camera.direction.set(0, 1, 0);
// camera.up.set(0, 0, 1);
// Cartesian3.cross(camera.direction, camera.up, camera.right);

camera.frustum.fov = Math.PI / 2.0;
camera.frustum.aspectRatio = deferredRenderer.drawingBufferWidth / deferredRenderer.drawingBufferHeight;

window.addEventListener('resize', () => {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  camera.frustum.aspectRatio = window.innerWidth / window.innerHeight;

  deferredRenderer.deferredRenderTargets.resize(canvas.width, canvas.height);
});

const cameraController = new OrbitCameraController(camera, canvas);
window['camera'] = camera;
window['cameraController'] = cameraController;
// cameraController.minPolarAngle = -Math.PI;
// cameraController.minDistance = 3;
cameraController.maxDistance = camera.frustum.far;
// camera.upAxis = new Cartesian3(0, 0, 1)
// cameraController.screenSpacePanning = false;
// cameraController.enableDamping = true;
// cameraController.dampingFactor = 0.6;
// cameraController.autoRotate = true;
// cameraController.touches.ONE = OrbitCameraController.TOUCH.PAN;
// cameraController.touches.TWO = OrbitCameraController.TOUCH.DOLLY_ROTATE;


const model = Model.fromGltf({
  // url: 'http://localhost:5501/examples/next/mvp/Box.gltf'
  // url: 'http://localhost:8080/2.0/Box/glTF-Embedded/Box.gltf'
  // url: 'http://localhost:5500/2.0/MultiUVTest/glTF/MultiUVTest.gltf',
  url: 'http://localhost:5500/2.0/SciFiHelmet/glTF/SciFiHelmet.gltf',
  // url: 'http://localhost:5500/2.0/DragonAttenuation/glTF/DragonAttenuation.gltf',
  // url: 'http://127.0.0.1:5500/2.0/MetalRoughSpheres/glTF/MetalRoughSpheres.gltf',
  // url: 'http://localhost:5500/2.0/DamagedHelmet/glTF/DamagedHelmet.gltf',
  // url: 'http://localhost:5500/2.0/SpecularTest/glTF/SpecularTest.gltf',
  // url: 'http://localhost:5500/2.0/ClearCoatTest/glTF/ClearCoatTest.gltf',
  // url: 'http://localhost:5500/2.0/Lantern/glTF/Lantern.gltf',
});
window['model'] = model;
model.readyPromise.then(() => {
  console.log(model);
});
scene.objects.push(model);

function startRenderLoop() {
  function frame(ms) {
    try {
      deferredRenderer.update(scene, camera);
      deferredRenderer.render();

      requestAnimationFrame(frame);
    } catch (error) {
      console.error(error);
    }
  }

  requestAnimationFrame(frame);
}

startRenderLoop();