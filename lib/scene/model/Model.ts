import Resource from "../../core/Resource";
import RuntimeError from "../../core/RuntimeError";
import defaultValue from "../../core/defaultValue";
import defined from "../../core/defined";
import FrameState from "../FrameState";
import ModelSceneGraph from "./ModelSceneGraph";
import { glTF } from "./glTF";
import GltfLoader from "./ResourceLoaders/GltfLoader";
import VertexArray from "../../renderer/VertexArray";
import ShaderProgram from "../../renderer/ShaderProgram";
import Matrix4 from "../../math/Matrix4";
import ModelUtility from "./ModelUtility";
import BoundingSphere from "../../core/BoundingSphere";
import DeveloperError from "../../core/DeveloperError";
import Cartesian3 from "../../math/Cartesian3";

function initialize(model: Model) {
  const loader = model._loader;
  const resource = model._resource;

  loader.load();

  const loaderPromise = loader.promise.then(function(loader) {
    // If the model is destroyed before the promise resolves, then
    // the loader will have been destroyed as well. Return early.
    if (!defined(loader)) {
      return;
    }

    const components = loader.components;
    if (!defined(components)) {
      if (loader.isUnloaded()) {
        return;
      }

      throw new RuntimeError('Failed to load model.');
    }

    const sceneGraph = new ModelSceneGraph({
      model: model,
      components: components,
    });

    model._sceneGraph = sceneGraph;

    model._resourcesLoaded = true;
  });

  const texturesLoadedPromise = defaultValue(loader._texturesLoadedPromise, Promise.resolve());
  model._texturesLoadedPromise = texturesLoadedPromise
    .then(function() {
      // If the model was destroyed while loading textures, return.
      if (!defined(model) || model.isDestroyed()) {
        return;
      }

      model._texturesLoaded = true;

      if (loader._incrementallyLoadTextures) {
        model.resetDrawCommands();
      }
    })
    .catch(function (error) {
      debugger
    });

  const promise: Promise<Model> = new Promise(function(resolve, reject) {
    model._completeLoad = function () {
      model._ready = true;
      resolve(model);
      return true;
    }
  })

  return loaderPromise
    .then(function() {
      return promise;
    });
}

/**
 * @public
 */
class Model {
  /** @internal */
  _loader: GltfLoader;
  /** @internal */
  _resource: Resource;
  /** @internal */
  _sceneGraph: ModelSceneGraph;
  /** @internal */
  _resourcesLoaded: boolean;
  /** @internal */
  _texturesLoaded: boolean;

  /** @internal */
  _ready: boolean;
  /** @internal */
  _readyPromise: Promise<Model>;
  /** @internal */
  _texturesLoadedPromise: Promise<void>;
  /** @internal */
  _completeLoad: (model: Model, frameState: FrameState) => void;

  /** @internal */
  _drawCommandsBuilt: boolean;
  /** @internal Keeps track of resources that need to be destroyed when the draw commands are reset. */
  _pipelineResources: (VertexArray | ShaderProgram)[];

  /** @internal */
  _backFaceCulling: boolean;
  /** @internal */
  _backFaceCullingDirty: boolean;
  public get backFaceCulling() { return this._backFaceCulling; }
  public set backFaceCulling(value: boolean) {
    if (this._backFaceCulling !== value) {
      this._backFaceCullingDirty = true;
    }
    this._backFaceCulling = value;
  }

  modelMatrix: Matrix4;
  /** @internal */
  _modelMatrix: Matrix4;
  /** @internal */
  _scale: number;
  /** @internal */
  _computedScale: number;
  /** @internal */
  _updateModelMatrix: boolean;

  public get scale() { return this._scale; }
  public set scale(value: number) {
    if (this._scale !== value) {
      this._updateModelMatrix = true;
    }
    this._scale = value;
  }
  /** @internal */
  public get computedScale() { return this._computedScale; }

  /** @internal // The model's bounding sphere and its initial radius are computed in ModelSceneGraph. */
  _boundingSphere: BoundingSphere;
  _initialRadius: number;
  get boundingSphere() {
    if (!this.ready) {
      throw new DeveloperError('The model is not loaded. Use Model.readyPromise or wait for Model.ready to be true.');
    }

    const modelMatrix = this.modelMatrix;
    updateBoundingSphere(this, modelMatrix);
    return this._boundingSphere;
  }

  public get ready() { return this._ready; }
  public get readyPromise() { return this._readyPromise; }
  /** @internal */
  public get sceneGraph() { return this._sceneGraph; }

  constructor(options: {
    loader: GltfLoader,
    resource: Resource,
    backFaceCulling?: boolean,
    modelMatrix?: Matrix4,
    scale?: number,
  }) {
    this._loader = options.loader;
    this._resource = options.resource;

    this._resourcesLoaded = false;
    this._texturesLoaded = false;

    this._drawCommandsBuilt = false;
    this._pipelineResources = [];

    this._backFaceCulling = defaultValue(options.backFaceCulling, true);
    this._backFaceCullingDirty = false;

    this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix, Matrix4.IDENTITY));
    this._modelMatrix = Matrix4.clone(this.modelMatrix);
    this._scale = defaultValue(options.scale, 1.0);
    this._computedScale = this._scale;
    this._updateModelMatrix = false;

    this._completeLoad = function () {};
    this._ready = false;
    this._readyPromise = initialize(this);
  }

  update(frameState: FrameState) {
    // Keep processing the model every frame until the main resources
    // (buffer views) and textures (which may be loaded asynchronously)
    // are processed.
    processLoader(this, frameState);

    if (!this._resourcesLoaded) {
      return;
    }

    buildDrawCommands(this, frameState);

    updateModelMatrix(this, frameState);

    updateBoundingSphereAndScale(this, frameState);

    if (!this.ready) {
      this._completeLoad(this, frameState);
      return;
    }

    // Update the scene graph and draw commands for any changes in model's properties
    // (e.g. model matrix, back-face culling)
    updateSceneGraph(this, frameState);
    submitDrawCommands(this, frameState);
  }

  isDestroyed() { return false; };

  static fromGltf(options: {
    url: string | Resource,
    basePath?: string | Resource,
    gltf?: string | Resource | glTF | Uint8Array,
    asynchronous?: boolean,
    incrementallyLoadTextures?: boolean,
    releaseGltfJson?: boolean,
  }) {
    // options.gltf is used internally for 3D Tiles. It can be a Resource, a URL
    // to a glTF/glb file, a binary glTF buffer, or a JSON object containing the
    // glTF contents.
    const gltf = defaultValue(options.url, options.gltf);

    const basePath = defaultValue(options.basePath, '');
    const baseResource = Resource.createIfNeeded(basePath);

    const gltfLoaderOptions = {
      asynchronous: options.asynchronous,
      incrementallyLoadTextures: options.incrementallyLoadTextures,
      releaseGltfJson: options.releaseGltfJson,
      gltfResource: undefined,
      baseResource: undefined,
      gltfJson: undefined,
      typedArray: undefined,
    };

    if (defined((gltf as glTF).asset)) {
      gltfLoaderOptions.gltfJson = gltf;
      gltfLoaderOptions.gltfResource = baseResource;
      gltfLoaderOptions.baseResource = baseResource;
    } else if (gltf instanceof Uint8Array) {
      gltfLoaderOptions.typedArray = gltf;
      gltfLoaderOptions.baseResource = baseResource;
      gltfLoaderOptions.gltfResource = baseResource;
    } else {
      gltfLoaderOptions.gltfResource = Resource.createIfNeeded(gltf as string);
    }
    const gltfLoader = new GltfLoader(gltfLoaderOptions);

    const modelOptions = {
      loader: gltfLoader,
      resource: gltfLoaderOptions.gltfResource,
    };
    return new Model(modelOptions);
  }

  /**
   * @internal
   */
  resetDrawCommands() {
    this._drawCommandsBuilt = false;
  }

  /**
   * @internal
   */
  destroyPipelineResources() {
    const pipelineResources = this._pipelineResources;
    for (const pipelineResource of pipelineResources) {
      pipelineResource.destroy();
    }
    this._pipelineResources.length = 0;
  }

}

function processLoader(model: Model, frameState: FrameState) {
  if (!model._resourcesLoaded || !model._texturesLoaded) {
    model._loader.process(frameState);
  }
}

function buildDrawCommands(model: Model, frameState: FrameState) {
  if (!model._drawCommandsBuilt) {
    model.destroyPipelineResources();

    model._sceneGraph.buildDrawCommands(frameState);

    model._drawCommandsBuilt = true;
  }
}

function updateModelMatrix(model: Model, frameState: FrameState) {
  if (Matrix4.equals(model.modelMatrix, model._modelMatrix)) {
    return;
  }

  model._updateModelMatrix = true;
  model._modelMatrix = Matrix4.clone(model.modelMatrix, model._modelMatrix);
}

function updateBoundingSphereAndScale(model: Model, frameState: FrameState) {
  if (!model._updateModelMatrix) {
    return;
  }

  const modelMatrix = model.modelMatrix;

  updateBoundingSphere(model, modelMatrix);
  updateComputedScale(model, modelMatrix, frameState);
}

function updateBoundingSphere(model: Model, modelMatrix: Matrix4) {
  model._boundingSphere.center = Cartesian3.multiplyByScalar(
    model._sceneGraph._boundingSphere.center,
    model._scale,
    model._boundingSphere.center
  );
  model._boundingSphere.radius = model._initialRadius * model._scale;

  model._boundingSphere = BoundingSphere.transform(
    model._boundingSphere,
    modelMatrix,
    model._boundingSphere
  );
}

function updateComputedScale(model: Model, modelMatrix: Matrix4, frameState: FrameState) {
  let scale = model.scale;

  model._computedScale = scale;
}

function updateSceneGraph(model: Model, frameState: FrameState) {
  const sceneGraph = model._sceneGraph;
  if (model._updateModelMatrix) {
    const modelMatrix = model.modelMatrix;
    sceneGraph.updateModelMatrix(modelMatrix, frameState);
    model._updateModelMatrix = false;
  }

  if (model._backFaceCullingDirty) {
    sceneGraph.updateBackFaceCulling(model._backFaceCulling);
    model._backFaceCullingDirty = false;
  }

  const updateForAnimations = true; //model._userAnimationDirty || model._activeAnimations.update(frameState);
  sceneGraph.update(frameState, updateForAnimations);
  // model._userAnimationDirty = false;
}

function submitDrawCommands(model: Model, frameState: FrameState) {
  model._sceneGraph.pushDrawCommands(frameState);
}

export default Model;
