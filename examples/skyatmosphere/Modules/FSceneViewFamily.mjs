/**
 * A set of views into a scene which only have different view transforms and owner actors.
 */
class SceneViewFamily {
  Views; // SceneView[]
  RenderTarget; //FRenderTarget
  Scene; // FSceneInterface

  constructor() {

  }
}

export default SceneViewFamily;