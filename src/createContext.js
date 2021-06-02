import { setCanvasToDisplaySize } from "./glUtils.js";
import defaultValue from './defaultValue.js';

const global = window;

/**
 * Create an instance of WebGLRenderingContext or WebGL2RenderingContext.
 * @param {Object} contextOptions 
 * @param {Boolean} contextOptions.alpha 
 * @param {Boolean} contextOptions.depth 
 * @param {Boolean} contextOptions.stencil 
 * @param {Boolean} contextOptions.antialias 
 * @param {Boolean} contextOptions.preserveDrawingBuffer 
 * @param {Boolean} contextOptions.premultipliedAlpha 
 * @param {Boolean} contextOptions.requireWebgl2 
 * @returns 
 */
function createContext(contextOptions) {
  contextOptions = defaultValue(contextOptions, defaultValue.EMPTY_OBJECT);

  const canvas = global.document.createElement('canvas');
  let gl;

  if (contextOptions.requireWebgl2) {
    gl = canvas.getContext('webgl2', contextOptions);
  } else {
    gl = canvas.getContext('webgl', contextOptions);
  }

  canvas.style.setProperty('display', 'block');
  setCanvasToDisplaySize(gl.canvas);
  return gl;
};

export default createContext;
