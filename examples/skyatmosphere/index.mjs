// import * as ToyGL from '../../dist/toygl.js';
// import * as ToyGL from '../../dist/toygl.esm.js';
import * as ToyGL from '../../src/index.js';
import { InitSkyAtmosphereForViews, RenderSkyAtmosphereLookUpTables, RenderSkyAtmosphere } from './Modules/SkyAtmosphereRendering.mjs';
const gl = ToyGL.createContext();
document.body.appendChild(gl.canvas);

InitSkyAtmosphereForViews(gl);

function render(ms) {
  requestAnimationFrame(render);

  RenderSkyAtmosphereLookUpTables(gl);
  RenderSkyAtmosphere(gl);
}

requestAnimationFrame(render);