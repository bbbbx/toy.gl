# ToyGL

A low level WebGL library that wraps the WebGL API into commands and state. Before using this library, you need to understand the basics of WebGL, such as vertex attribute, uniform, GLSL.

## Getting started

Draw a triangle:

```html
<script src="dist/toygl.js"></script>
<script>
  const gl = ToyGL.createContext();
  document.body.appendChild(gl.canvas);

  const vs = `
    attribute vec2 a_position;
    attribute vec3 a_color;
    varying vec3 v_color;
    void main() {
      gl_Position = vec4(a_position, 0, 1);
      v_color = a_color;
    }
  `;
  const fs = `
    precision highp float;
    varying vec3 v_color;
    void main() {
      gl_FragColor = vec4(v_color, 1);
    }
  `;

  function render(ms) {
    requestAnimationFrame(render);

    ToyGL.setState(gl, {
      viewport: [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight],
    });

    ToyGL.clear(gl, {
      color: [0, 0, 0, 1]
    });

    ToyGL.draw(gl, {
      vs: vs,
      fs: fs,
      attributes: {
        a_position: [
         -0.6, -0.4,
          0.6, -0.4,
            0,  0.6,
        ],
        a_color: [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ]
      },
      count: 3,
    });
  }

  requestAnimationFrame(render);
</script>
```

[Live demo](https://bbbbx.github.io/toy.gl/examples/triangle) of above example. See [examples](https://bbbbx.github.io/toy.gl/examples) folder for more examples.

## Documentation

Public funciton:

- `ToyGL.createContext(contextAttributes): WebGLRenderingContext`
- `ToyGL.setState(gl, state): void`
- `ToyGL.clear(gl, options): void`
- `ToyGL.draw(gl, options): void`
- `ToyGL.createTexture(gl, options): WebGLTexture`
- `ToyGL.createCubeMap(gl, options): WebGLTexture`
- `ToyGL.createFramebuffer(gl, options): WebGLFramebuffer`

### `ToyGL.createContext(contextAttributes)`

Create a full screen canvas, and return an instance of `WebGLRenderingContext`.

The `contextAttributes` object has the following property, same as `canvas.getContext()`:

- `alpha`: bool
- `depth`: bool
- `stencil`: bool
- `antialias`: bool
- `premultipliedAlpha`: bool
- `preserveDrawingBuffer`: bool

### `ToyGL.setState(gl, state)`

Set WebGL global state.

The `state` object has the following property:
- `cull`: Object
  - `enable`: bool
  - `face`: string, one of `back`, `front`, `front_and_back`.
- `depthTest`: Object
  - `enable`: bool
  - `func`: string
  - `write`: bool
- `stencilTest`: Object
- `colorMask`: Array
- `blend`: Object
- `viewport`: Array
- `scissor`: Object
  - `enable`: bool
  - `rect`: Array

All properties are optional.

### `ToyGL.clear(gl, options)`

Execute a clear command. Clear color buffer, depth buffer or stencil buffer.

The `options` object has the following property:

- `fb`: WebGLFramebuffer
- `color`: Array
- `depth`: number
- `stencil`: number

### `ToyGL.draw(gl, options)`

Execute a draw command, i.e. draw primitives.

The `options` object has the following property:

- `vs`: string
- `fs`: string
- `attributes`: Object
- `indices`: Array, optional
- `uniforms`: Object
- `count`: number
- `fb`: WebGLFramebuffer

### `createTexture(gl, options)`

### `createCubeMap(gl, options)`

### `createFramebuffer(gl, options)`

## Build

install dependencies:

```shell
npm install
```

build the bundles:

```bash
npm run build
```

the result will be placed on `dist` folder.

## License

MIT
