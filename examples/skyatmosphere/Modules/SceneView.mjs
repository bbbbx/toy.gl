import ViewMatrices from './ViewMatrices.mjs';

/**
 * A projection from scene space into a 2D screen region.
 */
class SceneView {
  Family; // SceneViewFamily
  constructor() {
  }

  /**
   * 
   * @param {Object} ViewUniformShaderParameters 
   * @param {ViewMatrices} InViewMatrices 
   * @param {ViewMatrices} InPreViewMatrices 
   */
  SetupCommonViewUniformBufferParameters(ViewUniformShaderParameters, InViewMatrices, InPreViewMatrices) {
    // ViewUniformShaderParameters.ViewToTranslatedWorld = 
    // ViewUniformShaderParameters.TranslatedWorldToClip = 
    ViewUniformShaderParameters.WorldToClip = InViewMatrices.GetViewProjectionMatrix();
    // ViewUniformShaderParameters.ClipToWorld = 
    // ViewUniformShaderParameters.TranslatedWorldToView = 
    // ViewUniformShaderParameters.TranslatedWorldToCameraView = 
    // ViewUniformShaderParameters.CameraViewToTranslatedWorld = 
    // ViewUniformShaderParameters.ViewToClip = 

    // 单位为 cm
    ViewUniformShaderParameters.WorldCameraOrigin = InViewMatrices.GetViewOrigin();

  }
}

export default SceneView;
