import defined from './defined.js';

const global = window;

/**
 * Create a program and/or bind attribute location.
 * 
 * @ignore
 * @param {WebGLRenderingContext} gl 
 * @param {String} vertexShaderSource 
 * @param {String} fragmentShaderSource 
 * @param {Object} attributeLocations { [attributeName]: location }
 * @returns {WebGLProgram}
 */
function createProgram(gl, vertexShaderSource, fragmentShaderSource, attributeLocations) {
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

  // bind attribute location
  if (defined(attributeLocations)) {
    for (const attributeName in attributeLocations) {
      if (Object.hasOwnProperty.call(attributeLocations, attributeName)) {
        const location = attributeLocations[attributeName];
        gl.bindAttribLocation(program, location, attributeName);
      }
    }
  }

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
  }

  return program;
}

function setCanvasToDisplaySize(canvas) {
  const dpr = global.devicePixelRatio;
  const displayWidth = Math.round(canvas.clientWidth * dpr);
  const displayHeight = Math.round(canvas.clientHeight * dpr);

  const needResize = canvas.width !== displayWidth ||
                     canvas.height !== displayHeight;

  if (needResize) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

function validateStencilFunc(func) {
  func = func.toUpperCase();
  return !!(func === 'NEVER' ||
    func === 'ALWAYS' ||
    func === 'LESS' ||
    func === 'LEQUAL' ||
    func === 'NOTEQUAL' ||
    func === 'EQUAL' ||
    func === 'GREATER' ||
    func === 'GEQUAL');
}

function validateStencilOp(op) {
  op = op.toUpperCase();
  return !!(op === 'KEEP' ||
    op === 'ZERO' ||
    op === 'REPLACE' ||
    op === 'INCR' ||
    op === 'DECR' ||
    op === 'INVERT' ||
    op === 'INCR_WRAP' ||
    op === 'DECR_WRAP');
}

function validateGLConstantDefinition(gl, constantName) {
  const constant = gl[constantName];
  if (!defined(constant)) {
    throw new Error('gl.' + constantName + ' is not defined.');
  }
  return constant;
}

export {
  validateGLConstantDefinition as validateGLConstantDefinition,
  validateStencilFunc,
  validateStencilOp,
  createProgram,
  setCanvasToDisplaySize,
};
