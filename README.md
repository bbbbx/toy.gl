# ToyGL
[![Release](https://github.com/bbbbx/toy.gl/actions/workflows/release.yml/badge.svg?branch=a1)](https://github.com/bbbbx/toy.gl/actions/workflows/release.yml)
[![Deploy static content to Pages](https://github.com/bbbbx/toy.gl/actions/workflows/pages.yml/badge.svg?branch=a1)](https://github.com/bbbbx/toy.gl/actions/workflows/pages.yml)

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

See [https://bbbbx.github.io/toy.gl/docs/](https://bbbbx.github.io/toy.gl/docs/).

## Build manually

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
