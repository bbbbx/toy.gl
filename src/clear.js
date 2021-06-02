import defined from './defined.js';
import defaultValue from './defaultValue.js';

/**
 * Execute a clear command.
 * @param {WebGLRenderingContext} gl 
 * @param {Object} [options] 
 * @param {Array} [options.color] 
 * @param {Number} [options.depth] 
 * @param {Number} [options.stencil] 
 * @param {WebGLFramebuffer} [options.fb] 
 */
function clear(gl, options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const { fb, color, depth, stencil } = options;

  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  let mask = 0;
  if (color) {
    gl.clearColor(color[0], color[1], color[2], color[3]);
    mask |= gl.COLOR_BUFFER_BIT;
  }
  if (defined(depth)) {
    gl.clearDepth(depth);
    mask |= gl.DEPTH_BUFFER_BIT;
  }
  if (stencil) {
    gl.clearStencil(stencil);
    mask |= gl.STENCIL_BUFFER_BIT;
  }

  if (mask !== 0) {
    gl.clear(mask);
  }
}

export default clear;
