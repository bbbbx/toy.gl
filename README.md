# ToyGL

A low level WebGL library.

Wrap to WebGL API as command and state.

## Getting started

Put a script tag in your HTML, then draw a triangle:

```js
TODO:
```

More examples can be found on `examples` folder.


## Documentation

Public funciton:

- `ToyGL.createContext(contextAttributes): WebGLRenderingContext`
- `ToyGL.setState(gl, state): void`
- `ToyGL.clear(gl, options): void`
- `ToyGL.draw(gl, options): void`
- `ToyGL.createTexture(gl, options): WebGLTexture`
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

Execute a clear command, i.e. draw primitives.

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