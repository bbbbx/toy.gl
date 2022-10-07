const { Cartesian3, Matrix4, createVAO, createCubeMap } = ToyGL;

const gl = ToyGL.createContext();
document.body.appendChild(gl.canvas);

const spherical = ToyGL.Spherical.fromCartesian3(new Cartesian3(0, -40, 0));
let dx = 0, dy = 0;
let velocity = { x: 0, y: 0 };
let prevX = 0, prevY = 0;
let pressed = false;
gl.canvas.addEventListener('pointerdown', e => {
  pressed = true;
  prevX = e.x;
  prevY = e.y;
});
gl.canvas.addEventListener('pointerup', e => {
  pressed = false;
});
gl.canvas.addEventListener('mousewheel', e => {
  spherical.radius += e.deltaY * 0.2;
  spherical.radius = ToyGL.Math.clamp(spherical.radius, 1, far-10);

  e.preventDefault();
});
gl.canvas.addEventListener('pointermove', e => {
  if (!pressed) return;

  const { x, y } = e;
  dx = x - prevX;
  dy = y - prevY;
  prevX = x;
  prevY = y;

  velocity.x += ToyGL.Math.toRadians(dx * 10);
  velocity.y += ToyGL.Math.toRadians(dy * 7);
});

const cubeMapTexture = createCubeMap(gl, {
  format: gl.RGBA,
  type: gl.FLOAT,
  internalFormat: gl.RGBA,
  width: 512,
  height: 512,
  data: {},
});
const renderToCubeMapFramebuffer = gl.createFramebuffer();
{
  gl.bindFramebuffer(gl.FRAMEBUFFER, renderToCubeMapFramebuffer);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X, cubeMapTexture, 0);
  
  const renderbuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 512, 512);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
  
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}


const renderCubeMapVS = `
  attribute vec3 aPosition;
  uniform mat4 uMvp;
  void main() {
    gl_Position = uMvp * vec4(aPosition, 1);
  }
`;
const renderCubeMapFS = `
  precision highp float;
  uniform vec4 uColor;
  void main() {
    gl_FragColor = uColor;
    gl_FragColor.rgb *= 0.7;
  }
`;

const vs = `
  attribute vec3 aPosition;
  varying vec3 vPosition;
  uniform mat4 uMvp;
  void main() {
    gl_Position = uMvp * vec4(aPosition, 1);
    vPosition = aPosition;
  }
`;
const fs = `
  precision highp float;
  varying vec3 vPosition;
  uniform samplerCube uCubeMap;
  void main() {
    gl_FragColor = textureCube(uCubeMap, normalize(vPosition));
  }
`;

const sphere = primitives.createSphereVertices(10, 64, 32);
const sphereVAO = ToyGL.createVAO(gl, {
  attributes: {
    aPosition: {
      location: 0,
      size: 3,
      data: sphere.position,
    },
  },
  indices: sphere.indices,
});
const axesVAO = ToyGL.createVAO(gl, {
  attributes: {
    aPosition: {
      location: 0,
      size: 3,
      data: [
        0, 0, 0,
        20, 0, 0,
        0, 0, 0,
        0, 20, 0,
        0, 0, 0,
        0, 0, 20,
      ],
    },
    aColor: {
      location: 1,
      size: 4,
      data: [
        1, 0, 0, 1,
        1, 0, 0, 1,
        0, 1, 0, 1,
        0, 1, 0, 1,
        0, 0, 1, 1,
        0, 0, 1, 1,
      ],
    },
  },
  indices: [0, 1, 2, 3, 4, 5],
});

const fovY = ToyGL.Math.toRadians(40);
const aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
const near = 0.1;
const far = 100;
const projectionMatrix = Matrix4.computePerspectiveFieldOfView(fovY, aspectRatio, near, far, new Matrix4());

const eyePosition = new Cartesian3(0, 0, 0);
const eyeDirection = new Cartesian3(0, 1, 0);
const eyeUp = new Cartesian3(0, 0, 1);
const eyeRight = Cartesian3.cross(eyeDirection, eyeUp, new Cartesian3());
const viewMatrix = new Matrix4();

const mvp = new Matrix4();

const ENV_CUBE_LOOK_DIR = [
  new Cartesian3( 1,  0,  0),
  new Cartesian3(-1,  0,  0),
  new Cartesian3( 0,  1,  0),
  new Cartesian3( 0, -1,  0),
  new Cartesian3( 0,  0,  1),
  new Cartesian3( 0,  0, -1),
];
const ENV_CUBE_LOOK_UP = [
  new Cartesian3( 0, -1,  0),
  new Cartesian3( 0, -1,  0),
  new Cartesian3( 0,  0,  1),
  new Cartesian3( 0,  0, -1),
  new Cartesian3( 0, -1,  0),
  new Cartesian3( 0, -1,  0),
];
const ENV_CUBE_COLOR = [
  [1, 0, 0, 1],
  [0, 1, 1, 1],
  [0, 1, 0, 1],
  [1, 0, 1, 1],
  [0, 0, 1, 1],
  [1, 1, 0, 1],
];

const rectangleProjectionMatrix = Matrix4.computePerspectiveFieldOfView(Math.PI / 2, 1, near, far, new Matrix4());

let prev = 0;
function render(ms) {
  requestAnimationFrame(render);

  const seconds = ms / 1000;
  const dt = seconds - prev;

  // Render to cube map
  for (let i = 0; i < 6; i++) {
    Cartesian3.fromElements(0, 0, 0, eyePosition);
    ENV_CUBE_LOOK_DIR[i].clone(eyeDirection);
    ENV_CUBE_LOOK_UP[i].clone(eyeUp);
    Cartesian3.cross(eyeDirection, eyeUp, eyeRight);
    Matrix4.computeView(eyePosition, eyeDirection, eyeUp, eyeRight, viewMatrix);

    Matrix4.multiply(rectangleProjectionMatrix, viewMatrix, mvp);

    gl.bindFramebuffer(gl.FRAMEBUFFER, renderToCubeMapFramebuffer);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMapTexture);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, cubeMapTexture, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    ToyGL.setState(gl, {
      viewport: [0, 0, 512, 512],
      cull: {
        enable: false,
      },
      depthTest: {
        enable: true,
      },
    });
    ToyGL.clear(gl, {
      color: [0, 0, 0, 1],
      depth: 1,
      fb: renderToCubeMapFramebuffer,
    });
    ToyGL.draw(gl, {
      vs: renderCubeMapVS,
      fs: renderCubeMapFS,
      attributeLocations: {
        aPosition: 0,
      },
      uniforms: {
        uMvp: mvp,
        uColor: ENV_CUBE_COLOR[i],
      },
      vao: sphereVAO,
      count: sphere.indices.length,
      fb: renderToCubeMapFramebuffer,
    });
  }

  velocity.x -= velocity.x * 20 * dt;
  velocity.y -= velocity.y * 20 * dt;

  spherical.phi += ToyGL.Math.toRadians(-velocity.x);
  spherical.theta += ToyGL.Math.toRadians(-velocity.y);
  spherical.theta = ToyGL.Math.clamp(spherical.theta, 0.001, ToyGL.Math.toRadians(179.999));

  Cartesian3.fromSpherical(spherical, eyePosition);
  Cartesian3.negate(eyePosition, eyeDirection);
  Cartesian3.normalize(eyeDirection, eyeDirection);
  Cartesian3.cross(eyeDirection, Cartesian3.UNIT_Z, eyeRight);

  if (Cartesian3.magnitudeSquared(eyeRight) < ToyGL.Math.EPSILON10) {
    Cartesian3.clone(Cartesian3.UNIT_X, eyeRight);
  }

  Cartesian3.normalize(eyeRight, eyeRight);
  Cartesian3.cross(eyeRight, eyeDirection, eyeUp);
  Cartesian3.normalize(eyeUp, eyeUp);

  Matrix4.computeView(eyePosition, eyeDirection, eyeUp, eyeRight, viewMatrix);
  Matrix4.multiply(projectionMatrix, viewMatrix, mvp);

  ToyGL.setState(gl, {
    viewport: [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight],
    cull: {
      enable: true,
      face: 'front',
    },
    depthTest: {
      enable: true,
    },
  });
  ToyGL.clear(gl, {
    color: [0, 0, 0, 1],
    depth: 1,
    fb: null,
  });
  ToyGL.draw(gl, {
    vs: vs,
    fs: fs,
    attributeLocations: {
      aPosition: 0,
    },
    uniforms: {
      uMvp: mvp,
      uCubeMap: cubeMapTexture,
    },
    vao: sphereVAO,
    count: sphere.indices.length,
    fb: null,
  });

  ToyGL.draw(gl, {
    vs: `
      attribute vec3 aPosition;
      attribute vec3 aColor;
      varying vec3 vColor;
      uniform mat4 uMvp;
      void main() {
        gl_Position = uMvp * vec4(aPosition, 1);
        vColor = aColor;
      }
    `,
    fs: `
      precision highp float;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1);
      }
    `,
    attributeLocations: {
      aPosition: 0,
      aColor: 1,
    },
    uniforms: {
      uMvp: mvp,
    },
    vao: axesVAO,
    count: 6,
    primitiveType: gl.LINES,
    fb: null,
  });

  prev = seconds;
}

requestAnimationFrame(render);
