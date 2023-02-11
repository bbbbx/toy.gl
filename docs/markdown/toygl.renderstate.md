<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [ToyGL](./toygl.md) &gt; [RenderState](./toygl.renderstate.md)

## RenderState class


**Signature:**

```typescript
declare class RenderState 
```

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(renderState)](./toygl.renderstate._constructor_.md) |  | Constructs a new instance of the <code>RenderState</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [blending](./toygl.renderstate.blending.md) |  | { enabled: boolean; color: [Color](./toygl.color.md)<!-- -->; equationRgb: [BlendEquation](./toygl.blendequation.md)<!-- -->; equationAlpha: [BlendEquation](./toygl.blendequation.md)<!-- -->; functionSourceRgb: [BlendFunction](./toygl.blendfunction.md)<!-- -->; functionSourceAlpha: [BlendFunction](./toygl.blendfunction.md)<!-- -->; functionDestinationRgb: [BlendFunction](./toygl.blendfunction.md)<!-- -->; functionDestinationAlpha: [BlendFunction](./toygl.blendfunction.md)<!-- -->; } |  |
|  [colorMask](./toygl.renderstate.colormask.md) |  | { red: boolean; green: boolean; blue: boolean; alpha: boolean; } |  |
|  [cull](./toygl.renderstate.cull.md) |  | { enabled: boolean; face: [CullFace](./toygl.cullface.md)<!-- -->; } |  |
|  [depthMask](./toygl.renderstate.depthmask.md) |  | boolean |  |
|  [depthRange](./toygl.renderstate.depthrange.md) |  | { near: number; far: number; } |  |
|  [depthTest](./toygl.renderstate.depthtest.md) |  | { enabled: boolean; func: [DepthFunction](./toygl.depthfunction.md)<!-- -->; } |  |
|  [frontFace](./toygl.renderstate.frontface.md) |  | [WindingOrder](./toygl.windingorder.md) |  |
|  [lineWidth](./toygl.renderstate.linewidth.md) |  | number |  |
|  [polygonOffset](./toygl.renderstate.polygonoffset.md) |  | { enabled: boolean; factor: number; units: number; } |  |
|  [sampleCoverage](./toygl.renderstate.samplecoverage.md) |  | { enabled: boolean; value: number; invert: boolean; } |  |
|  [scissorTest](./toygl.renderstate.scissortest.md) |  | { enabled: boolean; rectangle: [BoundingRectangle](./toygl.boundingrectangle.md)<!-- -->; } |  |
|  [stencilMask](./toygl.renderstate.stencilmask.md) |  | number |  |
|  [stencilTest](./toygl.renderstate.stenciltest.md) |  | { enabled: boolean; frontFunction: [StencilFunction](./toygl.stencilfunction.md)<!-- -->; backFunction: [StencilFunction](./toygl.stencilfunction.md)<!-- -->; reference: number; mask: number; frontOperation: { fail: [StencilOperation](./toygl.stenciloperation.md)<!-- -->; zFail: [StencilOperation](./toygl.stenciloperation.md)<!-- -->; zPass: [StencilOperation](./toygl.stenciloperation.md)<!-- -->; }; backOperation: { fail: [StencilOperation](./toygl.stenciloperation.md)<!-- -->; zFail: [StencilOperation](./toygl.stenciloperation.md)<!-- -->; zPass: [StencilOperation](./toygl.stenciloperation.md)<!-- -->; }; } |  |
|  [viewport](./toygl.renderstate.viewport.md) |  | [BoundingRectangle](./toygl.boundingrectangle.md) |  |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [clearCache()](./toygl.renderstate.clearcache.md) | <code>static</code> |  |
|  [fromCache(renderState)](./toygl.renderstate.fromcache.md) | <code>static</code> |  |
|  [getCache()](./toygl.renderstate.getcache.md) | <code>static</code> |  |
|  [removeFromCache(renderState)](./toygl.renderstate.removefromcache.md) | <code>static</code> |  |
