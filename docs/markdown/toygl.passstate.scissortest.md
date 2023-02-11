<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [ToyGL](./toygl.md) &gt; [PassState](./toygl.passstate.md) &gt; [scissorTest](./toygl.passstate.scissortest.md)

## PassState.scissorTest property

When defined, this overrides the scissor test property of a [DrawCommand](./toygl.drawcommand.md)<!-- -->'s render state. This is used to, for example, to allow the renderer to scissor out the pick region during the picking pass. <p> When this is <code>undefined</code>, the [DrawCommand](./toygl.drawcommand.md)<!-- -->'s property is used. </p>

**Signature:**

```typescript
scissorTest: {
        enabled: boolean;
        rectangle: BoundingRectangle;
    };
```