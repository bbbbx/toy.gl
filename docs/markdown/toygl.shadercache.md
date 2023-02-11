<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [ToyGL](./toygl.md) &gt; [ShaderCache](./toygl.shadercache.md)

## ShaderCache class


**Signature:**

```typescript
declare class ShaderCache 
```

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(context)](./toygl.shadercache._constructor_.md) |  | Constructs a new instance of the <code>ShaderCache</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [\_context](./toygl.shadercache._context.md) |  | [Context](./toygl.context.md) |  |
|  [\_numberOfShaders](./toygl.shadercache._numberofshaders.md) |  | number |  |
|  [\_shaders](./toygl.shadercache._shaders.md) |  | { \[keyword: string\]: CachedShader; } |  |
|  [\_shadersToRelease](./toygl.shadercache._shaderstorelease.md) |  | { \[key: string\]: CachedShader; } |  |
|  [numberOfShaders](./toygl.shadercache.numberofshaders.md) | <code>readonly</code> | number |  |

## Methods

|  Method | Modifiers | Description |
|  --- | --- | --- |
|  [destroy()](./toygl.shadercache.destroy.md) |  |  |
|  [destroyReleasedShaderPrograms()](./toygl.shadercache.destroyreleasedshaderprograms.md) |  |  |
|  [getShaderProgram(options)](./toygl.shadercache.getshaderprogram.md) |  |  |
|  [isDestroyed()](./toygl.shadercache.isdestroyed.md) |  |  |
|  [releaseShaderProgram(shaderProgram)](./toygl.shadercache.releaseshaderprogram.md) |  |  |
|  [replaceShaderProgram(options)](./toygl.shadercache.replaceshaderprogram.md) |  |  |
