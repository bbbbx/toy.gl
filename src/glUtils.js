const global = window;

function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vertexShaderSource);
  gl.compileShader(vs);
  
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, fragmentShaderSource);
  gl.compileShader(fs);

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);

  gl.deleteShader(vs);
  gl.deleteShader(fs);

  // TODO:
  // for (const attributeName in attributeLocation) {
  //   if (Object.hasOwnProperty.call(attributeLocation, attributeName)) {
  //     const location = attributeLocation[attributeName];
  //     gl.bindAttribLocation(program, location, attributeName);
  //   }
  // }

  gl.linkProgram(program);

  let log = '';
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      log = gl.getShaderInfoLog(fs);
      console.error('Fragment shader failed to compiled: ' + log);
    }

    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      log = gl.getShaderInfoLog(vs);
      console.error('Vertex shader failed to compiled: ' + log);
    }

    log = gl.getProgramInfoLog(program);
    console.error('Shader program link log: ' + log);
    throw new Error(info);
  }

  return program;
}

function setCanvasToDisplaySize(canvas) {
  const devicePixelRatio = global.devicePixelRatio;
  const width = global.innerWidth;
  const height = global.innerHeight;
  canvas.width = width * devicePixelRatio; 
  canvas.height = height * devicePixelRatio; 
  canvas.style.setProperty('width', width + 'px');
  canvas.style.setProperty('height', height + 'px');
}

function validateStencilFunc(func) {
  func = func.toUpperCase();
  if (func === 'NEVER' ||
    func === 'ALWAYS' ||
    func === 'LESS' ||
    func === 'LEQUAL' ||
    func === 'NOTEQUAL' ||
    func === 'EQUAL' ||
    func === 'GREATER' ||
    func === 'GEQUAL'
  ) {
    return true;
  }
  return false;
}

function validateStencilOp(op) {
  op = op.toUpperCase();
  if (op === 'KEEP' ||
    op === 'ZERO' ||
    op === 'REPLACE' ||
    op === 'INCR' ||
    op === 'DECR' ||
    op === 'INVERT' ||
    op === 'INCR_WRAP' ||
    op === 'DECR_WRAP'
  ) {
    return true;
  }
  return false;
}

export {
  validateStencilFunc,
  validateStencilOp,
  createProgram,
  setCanvasToDisplaySize,
};