import PrimitiveType from "../../core/PrimitiveType";
import clone from "../../core/clone";
import defined from "../../core/defined";
import { UniformMap } from "../../renderer/IDrawCommand";
import { VertexArrayAttribute } from "../../renderer/IVertexArray";
import RenderState from "../../renderer/RenderState";
import ShaderBuilder from "../../renderer/ShaderBuilder";
import Model from "./Model";
import ModelAlphaOptions from "./ModelAlphaOptions";
import { Indices, Primitive } from "./ModelComponents";
import ModelRuntimeNode from "./ModelRuntimeNode";
import ModelRuntimePrimitive from "./ModelRuntimePrimitive";
import ModelUtility from "./ModelUtility";
import NodeRenderResources from "./NodeRenderResources";
import VertexAttributeSemantic from "./VertexAttributeSemantic";
import BoundingSphere from "../../core/BoundingSphere";
import Cartesian3 from "../../math/Cartesian3";

class PrimitiveRenderResources {
  model: Model
  shaderBuilder: ShaderBuilder;
  uniformMap: UniformMap;
  renderStateOptions: ConstructorParameters<typeof RenderState>[0];
  alphaOptions: ModelAlphaOptions;

  runtimeNode: ModelRuntimeNode;
  attributes: VertexArrayAttribute[];
  attributeIndex: number;
  instanceCount: number;

  runtimePrimitive: ModelRuntimePrimitive;
  primitive: Primitive;
  count: number;
  indices: Indices;
  primitiveType: PrimitiveType;

  positionMin: Cartesian3;
  positionMax: Cartesian3;
  boundingSphere: BoundingSphere;

  constructor(nodeRenderResources: NodeRenderResources, runtimePrimitive: ModelRuntimePrimitive) {
    this.model = nodeRenderResources.model;
    this.shaderBuilder = nodeRenderResources.shaderBuilder.clone();
    this.uniformMap = clone(nodeRenderResources.uniformMap);
    this.renderStateOptions = clone(nodeRenderResources.renderStateOptions, true);
    this.alphaOptions = clone(nodeRenderResources.alphaOptions);

    this.runtimeNode = nodeRenderResources.runtimeNode;
    this.attributes = nodeRenderResources.attributes.slice();
    this.attributeIndex = nodeRenderResources.attributeIndex;
    this.instanceCount = nodeRenderResources.instanceCount;

    this.runtimePrimitive = runtimePrimitive;
    this.primitive = runtimePrimitive.primitive;
    const primitive = runtimePrimitive.primitive;
    this.count = defined(primitive.indices)
      ? primitive.indices.count
      : ModelUtility.getAttributeBySemantic(primitive, VertexAttributeSemantic.POSITION).count;
    this.indices = primitive.indices;
    this.primitiveType = primitive.primitiveType;

    const positionMinMax = ModelUtility.getPositionMinMax(primitive, this.runtimeNode.instancingTranslationMin, this.runtimeNode.instancingTranslationMax);
    this.positionMin = Cartesian3.clone(positionMinMax.min, new Cartesian3());
    this.positionMax = Cartesian3.clone(positionMinMax.max, new Cartesian3());
    this.boundingSphere = BoundingSphere.fromCornerPoints(this.positionMin, this.positionMax, new BoundingSphere());
  }
}

export default PrimitiveRenderResources;
