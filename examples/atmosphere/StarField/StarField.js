import { Cartesian2, Cartesian4, Matrix3, Matrix4 } from '../../../dist/toygl.esm.js';
import defined from '../../../src/defined.js';
import MMath from '../../../src/Math/Math.js';
import BrightStarCatalog from './BrightStarCatalog.js';

const StarFieldVert = await fetch('./StarField/StarField.vert').then(r => r.text());
const StarFieldFrag = await fetch('./StarField/StarField.frag').then(r => r.text());
const LogDepthVert = await fetch('./LogDepth.vert').then(r => r.text());
const LogDepthFrag = await fetch('./LogDepth.frag').then(r => r.text());


/**
 * 
 * @param {WebGLRenderingContext} gl 
 * @returns 
 */
function StarField(gl) {
  this._gl = gl;

  if (!(gl instanceof WebGL2RenderingContext) && !(gl.getExtension('EXT_shader_texture_lod') && gl.drawArraysInstanced)) {
    return undefined;
  }

  this._paramsTexture = undefined;
  this._brightStarCatalogVAO = undefined;
  this._brightness = 1.0;
  this._invWindowSize = new Cartesian2();

  /**
   * 当前视角下的星空纹理。
   * @type {WebGLTexture}
   */
  this.starFieldTexture = undefined;

  this._framebuffer = undefined;

  /**
   * 星星的亮度
   * @type {Number}
   * @default 1.0
   */
  this.luminanceReference = 1.0;


  // Updated at runtime
  this._far = 1000.0;
  this._temeToPseudoFixed = Matrix3.clone(Matrix3.IDENTITY);
  this._viewRotation = Matrix3.clone(Matrix3.IDENTITY);
  this._projectionMatrix = Matrix4.clone(Matrix4.IDENTITY);

  /**
   * 星星的大小
   * @type {Number}
   * @default 2.0
   */
  this.starScale = 2.0;

  const starField = this;
  this._uniforms = {
    uBrightness: function() {
      return starField._brightness;
    },
    uParamsSampler: function() {
      return starField._paramsTexture;
    },
    uInvWindowSize: function() {
      return starField._invWindowSize;
    },
    uStarCount: function() {
      return BrightStarCatalog.stars.length;
    },
    uLuminanceReference: function() {
      return starField.luminanceReference;
    },

    uFar: function() {
      return starField._far;
    },
    uTemeToPseudoFixed: function() {
      return starField._temeToPseudoFixed;
    },
    uViewRotation: function() {
      return starField._viewRotation;
    },
    uProjectionMatrix: function() {
      return starField._projectionMatrix;
    },

    uStarScale: function() {
      return starField.starScale;
    },

    uOneOverLog2FarPlusOne: function() {
      return 1.0 / Math.log2(starField._far + 1.0);
    }
  };
}

/**
 * 
 * @param {Object} options 
 * @param {Number} options.far
 * @param {Matrix3} options.temeToPseudoFixed
 * @param {Matrix3} options.viewRotation
 * @param {Matrix4} options.projectionMatrix 
 * @param {Cartesian4} options.viewport 
 */
StarField.prototype.update = function(options) {
  const gl = this._gl;
  const starCount = BrightStarCatalog.stars.length;

  if (!this._paramsTexture) {
    const paramesData = new Float32Array(new Array(starCount * 4));

    for (let i = 0; i < BrightStarCatalog.stars.length; i++) {
      const star = BrightStarCatalog.stars[i];

      const cosElevation = Math.cos(star.elevation);

      paramesData[i*4 + 0] = Math.sin(star.azimuth * 24) * cosElevation;
      paramesData[i*4 + 1] = Math.cos(star.azimuth * 24) * cosElevation;
      paramesData[i*4 + 2] = Math.sin(star.elevation);
      paramesData[i*4 + 3] = star.magnitude;
    }

    this._paramsTexture = ToyGL.createTexture(gl, {
      width: starCount,
      height: 1,
      format: gl.RGBA,
      type: gl.FLOAT,
      internalFormat: (gl instanceof WebGL2RenderingContext) ? gl.RGBA32F : gl.RGBA,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      minFilter: gl.NEAREST,
      magFilter: gl.NEAREST,
      data: paramesData,
    });
  }

  if (!this._brightStarCatalogVAO) {
    const instanceId = new Array(starCount).fill(0).map(function(v, i) { return i; });
    const position = [
      -0.5, -0.5,
      -0.5,  0.5,
      0.5, -0.5,
      0.5,  0.5,
    ];

    this._brightStarCatalogVAO = ToyGL.createVAO(gl, {
      attributes: {
        position: {
          location: 0,
          size: 2,
          data: position,
          divisor: 0,
        },
        instanceId: {
          location: 1,
          size: 1,
          data: instanceId,
          divisor: 1,
        },
      },
    });
  }

  if (!defined(this.starFieldTexture)) {
    const width = options.viewport.z;
    const height = options.viewport.w;
    this.starFieldTexture = ToyGL.createTexture(gl, {
      width: width,
      height: height,
      internalFormat: (gl instanceof WebGL2RenderingContext) ? gl.RGBA32F : gl.RGBA,
      format: gl.RGBA,
      type: gl.FLOAT,
      data: null,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    });
  }

  if (!defined(this._framebuffer)) {
    this._framebuffer = ToyGL.createFramebuffer(gl, {
      colorTexture: this.starFieldTexture,
    });
  }

  // Update
  if (defined(options.far)) {
    this._far = options.far;
  }
  Matrix3.clone(options.temeToPseudoFixed, this._temeToPseudoFixed);
  Matrix3.clone(options.viewRotation, this._viewRotation);
  Matrix4.clone(options.projectionMatrix, this._projectionMatrix);

  this._invWindowSize.x = 1.0 / options.viewport.z;
  this._invWindowSize.y = 1.0 / options.viewport.w;

  ToyGL.setState(gl, {
    viewport: Array.from(options.viewport),
    // depthTest: {
    //   enable: false,
    //   write: false,
    // },
    // cull: {
    //   enable: false,
    // },
  });
  ToyGL.clear(gl, {
    color: [0, 0, 0, 1],
    depth: 1,
    fb: this._framebuffer,
  });
  ToyGL.draw(gl, {
    vs: `
      ${LogDepthVert}
      ${StarFieldVert}
    `,
    fs: `
      ${LogDepthFrag}
      ${StarFieldFrag}
    `,
    attributeLocations: {
      position: 0,
      instanceId: 1,
    },
    vao: this._brightStarCatalogVAO,
    uniforms: this._uniforms,
    primitiveType: gl.TRIANGLE_STRIP,
    count: 4,
    instanceCount: starCount,
    fb: this._framebuffer,
  });
};

StarField.prototype.destroy = function() {
  const gl = this._gl;
  if (this._brightStarCatalogTexture) {
    gl.deleteTexture(this._brightStarCatalogTexture);
  }
  if (this._brightStarCatalogVAO) {
    gl.deleteVertexArray(this._brightStarCatalogVAO);
  }

  if (this.starFieldTexture) {
    gl.deleteTexture(this.starFieldTexture);
  }
  if (this._framebuffer) {
    gl.deleteFramebuffer(this._framebuffer);
  }

  if (this._paramsTexture) {
    gl.deleteTexture(this._paramsTexture);
  }
};

export default StarField;
