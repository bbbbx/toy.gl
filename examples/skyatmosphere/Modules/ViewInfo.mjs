import SceneView from './SceneView.mjs';
import AtmosphereSetup from './AtmosphereSetup.mjs';
// import { Cartesian3, Cartesian4 } from '../../../src/index.js';
import * as ToyGL from '../../../src/index.js';
const { Cartesian3, Cartesian4 } = ToyGL;


function ShouldRenderSkyAtmosphere(Scene, ) {
  return true;
  // return Scene && Scene.skyAtmosphere ;
}

class ViewInfo extends SceneView {
  PreExposure;
  bIsReflectionCapture;

  constructor() {
    super();

    this.Init();
  }

  Init() {
    this.PreExposure = 1.0;
    this.bIsReflectionCapture = false;
  }

  SetupUniformBufferParameters(SceneContext, InViewMatrices, InPreViewMatrices, ViewUniformShaderParameters) {

    this.SetupCommonViewUniformBufferParameters(ViewUniformShaderParameters, InViewMatrices, InPreViewMatrices);

    let Scene;
    if (this.Family.Scene) {
      Scene = this.Family.Scene;
    }

    if (Scene) {
      // Atmospheric fog parameters
      // const SunLight = Scene.AtmosphereLights[0];	// Atmospheric fog only takes into account the a single sun light with index 0.
      // if (ShouldRenderAtmosphere(this.Family) && Scene.AtmosphericFog) {
      //   ViewUniformShaderParameters.AtmosphericFogSunPower = 
      // }
    } else {}

    if (ShouldRenderSkyAtmosphere(Scene)) {
      const SkyAtmosphere = Scene.SkyAtmosphere;
      const SkyAtmosphereSceneProxy = SkyAtmosphere.GetSkyAtmosphereSceneProxy();


      const atmosphereSetup = SkyAtmosphereSceneProxy.GetAtmosphereSetup();
      ViewUniformShaderParameters.SkyAtmosphereBottomRadiusKm = atmosphereSetup.BottomRadiusKm;
      ViewUniformShaderParameters.SkyAtmosphereTopRadiusKm = atmosphereSetup.TopRadiusKm;

      // The constants below should match the one in SkyAtmosphereCommon.ush
      const PlanetRadiusOffset = 0.01; // Always force to be 10 meters above the ground/sea level (to always see the sky and not be under the virtual planet occluding ray tracing)

      const Offset = PlanetRadiusOffset * AtmosphereSetup.SkyUnitToCm;
      const BottomRadiusWorld = atmosphereSetup.BottomRadiusKm * AtmosphereSetup.SkyUnitToCm;
      const PlanetCenterWorld = Cartesian3.multiplyByScalar(atmosphereSetup.PlanetCenterKm, AtmosphereSetup.SkyUnitToCm, new Cartesian3());
      const PlanetCenterToCameraWorld = Cartesian3.subtract(ViewUniformShaderParameters.WorldCameraOrigin, PlanetCenterWorld, new Cartesian3());
      const DistanceToPlanetCenterWorld = Cartesian3.magnitude(PlanetCenterToCameraWorld);

      // If the camera is below the planet surface, we snap it back onto the surface.
      // This is to make sure the sky is always visible even if the camera is inside the virtual planet.
      ViewUniformShaderParameters.SkyWorldCameraOrigin = DistanceToPlanetCenterWorld < (BottomRadiusWorld + Offset) ?
        // PlanetCenterWorld + (BottomRadiusWorld + Offset) * (PlanetCenterToCameraWorld / DistanceToPlanetCenterWorld) :
        Cartesian3.add(
          PlanetCenterWorld,
          Cartesian3.multiplyByScalar(
            Cartesian3.divideByScalar(
              PlanetCenterToCameraWorld,
              DistanceToPlanetCenterWorld,
              new Cartesian3()),
            new Cartesian3()),
          BottomRadiusWorld + Offset,
          new Cartesian3()) :
        ViewUniformShaderParameters.WorldCameraOrigin;
      ViewUniformShaderParameters.SkyPlanetCenterAndViewHeight = new Cartesian4(
        PlanetCenterWorld.x,
        PlanetCenterWorld.y,
        PlanetCenterWorld.z,
        Cartesian3.magnitude(Cartesian3.subtract(ViewUniformShaderParameters.SkyWorldCameraOrigin, PlanetCenterWorld, new Cartesian3()))
      );
    }

    ViewUniformShaderParameters.PreExposure = this.PreExposure;
    ViewUniformShaderParameters.OneOverPreExposure = 1.0 / this.PreExposure;

  }
}

export default ViewInfo;

