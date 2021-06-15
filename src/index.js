import createContext from './createContext.js';
import setState from './setState.js';
import createFramebuffer from './createFramebuffer.js';
import createTexture from './createTexture.js';
import createCubeMap from './createCubeMap.js';
import clear from './clear.js';
import draw from './draw.js';

const ToyGL = {
  createContext,
  setState,
  clear,
  draw,
  createTexture,
  createCubeMap,
  createFramebuffer,
};

export default ToyGL;