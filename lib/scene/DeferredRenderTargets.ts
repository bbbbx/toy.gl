import PixelDatatype from "../core/PixelDatatype";
import PixelFormat from "../core/PixelFormat";
import PixelInternalFormat from "../core/PixelInternalFormat";
import WebGLConstants from "../core/WebGLConstants";
import defaultValue from "../core/defaultValue";
import Context from "../renderer/Context";
import CubeMapFace from "../renderer/CubeMapFace";
import Framebuffer from "../renderer/Framebuffer";
import Renderbuffer from "../renderer/Renderbuffer";
import Texture from "../renderer/Texture";
import RenderTargets from "./RenderTargets";

class DeferredRenderTargets extends RenderTargets {
  context: Context;
  colorBuffers: Texture[] = [];

  // _rt0: Texture; // lighting accumulation/emissive
  // _rt1: Texture; // world normal, Octahedron Normal Vectors, RGB10_A2
  // _rt2: Texture; // (Metallic, Specular, Roughness, ShadingModelID | SelectiveOutputMask)
  // _rt3: Texture; // (base color, AO), sRGB
  // _rt4: Texture; // (clearcoat, clearcoat roughness)
  // _rt5: Texture;
  // _rt6: Texture; // (world tangent, anisotropy)
  // _rt7: Texture; // clearcoat normal
  depthBuffer: Texture;

  width: number;
  height: number;

  constructor(options: {
    context: Context,
    width?: number,
    height?: number,
  }) {
    const context = options.context;

    super(context);

    this.context = context;

    const width = defaultValue(options.width, context.drawingBufferWidth);
    const height = defaultValue(options.height, context.drawingBufferHeight);
    this.resize(width, height)
  }

  resize(width: number, height: number) {
    const context = this.context;

    this.colorBuffers.forEach(buffer => buffer = buffer && buffer.destroy());
    this.depthBuffer = this.depthBuffer && this.depthBuffer.destroy();
    this.depthStencilBuffer = this.depthStencilBuffer && this.depthStencilBuffer.destroy();
    this.framebuffer = this.framebuffer && this.framebuffer.destroy();

    const rt0 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.HALF_FLOAT,
      pixelFormat: PixelFormat.RGBA,
    });

    const rt1 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_INT_2_10_10_10_REV,
      pixelFormat: PixelFormat.RGBA,
    });

    const rt2 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });

    const rt3 = new Texture({
      context: context,
      width: width,
      height: height,
      internalFormat: PixelInternalFormat.SRGB8_ALPHA8,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });

    const rt4 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });

    const rt5 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });

    const rt6 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });

    // this._rt7 = new Texture({
    //   context: context,
    //   width: width,
    //   height: height,
    //   pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
    //   pixelFormat: PixelFormat.RGBA,
    // });

    this.colorBuffers = [
      rt0,
      rt1,
      rt2,
      rt3,
      rt4,
      rt5,
      rt6,
      // this._rt7,
    ];
    this.depthBuffer = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_INT,
      pixelFormat: PixelFormat.DEPTH_COMPONENT,
    });
    this.framebuffer = new Framebuffer({
      context: context,
      colorTextures: this.colorBuffers,
      depthTexture: this.depthBuffer,
      destroyAttachments: false,
    });

    this.width = width;
    this.height = height;
  }


  getColorBuffer(location: number): Texture {
    return this.colorBuffers[location];
  }
  getDepthBuffer(): Texture {
    return this.depthBuffer;
  }
}

export default DeferredRenderTargets;
