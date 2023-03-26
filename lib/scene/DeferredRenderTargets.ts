import PixelDatatype from "../core/PixelDatatype";
import PixelFormat from "../core/PixelFormat";
import PixelInternalFormat from "../core/PixelInternalFormat";
import WebGLConstants from "../core/WebGLConstants";
import Context from "../renderer/Context";
import Framebuffer from "../renderer/Framebuffer";
import Texture from "../renderer/Texture";

class DeferredRenderTargets {
  _framebuffer: Framebuffer
  _rt0: Texture; // lighting accumulation/emissive
  _rt1: Texture; // world normal, Octahedron Normal Vectors, RGB10_A2
  _rt2: Texture; // (Metallic, Specular, Roughness, ShadingModelID | SelectiveOutputMask)
  _rt3: Texture; // (base color, AO), sRGB
  _rt4: Texture; // (clearcoat, clearcoat roughness)
  _rt5: Texture;
  _rt6: Texture; // (world tangent, anisotropy)
  _rt7: Texture; // clearcoat normal
  _depthTexture: Texture;

  public get framebuffer() { return this._framebuffer; }

  constructor(options: {
    context: Context,
    width: number,
    height: number,
  }) {
    const context = options.context;
    const width = options.width;
    const height = options.height;

    this._rt0 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.HALF_FLOAT,
      pixelFormat: PixelFormat.RGBA,
    });

    this._rt1 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_INT_2_10_10_10_REV,
      pixelFormat: PixelFormat.RGBA,
    });

    this._rt2 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });

    this._rt3 = new Texture({
      context: context,
      width: width,
      height: height,
      internalFormat: PixelInternalFormat.SRGB8_ALPHA8,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });

    this._rt4 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });

    this._rt5 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });

    this._rt6 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });

    this._rt7 = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_BYTE,
      pixelFormat: PixelFormat.RGBA,
    });

    this._depthTexture = new Texture({
      context: context,
      width: width,
      height: height,
      pixelDatatype: PixelDatatype.UNSIGNED_INT,
      pixelFormat: PixelFormat.DEPTH_COMPONENT,
    });

    this._framebuffer = new Framebuffer({
      context: context,
      colorTextures: [
        this._rt0,
        this._rt1,
        this._rt2,
        this._rt3,
        this._rt4,
        this._rt5,
        this._rt6,
        this._rt7,
      ],
      depthTexture: this._depthTexture,
    });
  }

  getRT0() : Texture { return this._rt0; }
  getRT1() : Texture { return this._rt1; }
  getRT2() : Texture { return this._rt2; }
  getRT3() : Texture { return this._rt3; }
  getRT4() : Texture { return this._rt4; }
  getRT5() : Texture { return this._rt5; }
  getRT6() : Texture { return this._rt6; }
  getRT7() : Texture { return this._rt7; }
  getDepthTexture() : Texture { return this._depthTexture; }
}

export default DeferredRenderTargets;
