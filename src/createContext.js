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
 * @param {HTMLCanvasElement} contextOptions.canvas 
 * @returns 
 */
function createContext(contextOptions) {
  contextOptions = defaultValue(contextOptions, defaultValue.EMPTY_OBJECT);

  let canvas = contextOptions.canvas;
  if (!canvas) {
    canvas = global.document.createElement('canvas');
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.setProperty('display', 'block');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  let gl;
  if (contextOptions.requireWebgl2) {
    gl = canvas.getContext('webgl2', contextOptions);
  } else {
    gl = canvas.getContext('webgl', contextOptions);
  }

  return gl;
};

export default createContext;
