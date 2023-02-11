<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [ToyGL](./toygl.md) &gt; [Matrix4](./toygl.matrix4.md) &gt; [computeView](./toygl.matrix4.computeview.md)

## Matrix4.computeView() method

Computes a Matrix4 instance that transforms from world space to view space.

**Signature:**

```typescript
static computeView(position: Cartesian3, direction: Cartesian3, up: Cartesian3, right?: Cartesian3, result?: Matrix4): Matrix4;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  position | [Cartesian3](./toygl.cartesian3.md) | The position of the camera. |
|  direction | [Cartesian3](./toygl.cartesian3.md) | The forward direction. |
|  up | [Cartesian3](./toygl.cartesian3.md) | The up direction. |
|  right | [Cartesian3](./toygl.cartesian3.md) | _(Optional)_ The right direction. |
|  result | [Matrix4](./toygl.matrix4.md) | _(Optional)_ The object in which the result will be stored. |

**Returns:**

[Matrix4](./toygl.matrix4.md)

The modified result parameter.
