import defaultValue from './defaultValue.js';

const FRAMEBUFFER_STATUS = {
  36053: 'FRAMEBUFFER_COMPLETE',
  36054: 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT',
  36055: 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT',
  36057: 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS',
  36061: 'FRAMEBUFFER_UNSUPPORTED',
};

/**
 * 
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl 
 * @param {Object} options 
 * @param {WebGLTexture} options.colorTexture
 * @param {WebGLTexture} options.depthTexture
 * @param {WebGLRenderbuffer} options.depthRenderbuffer
 * @param {Array<WebGLTexture|WebGLRenderbuffer>} options.colorAttachments
 * @returns {WebGLFramebuffer}
 */
function createFramebuffer(gl, options) {
  const { colorTexture, depthTexture, depthRenderbuffer } = options;
  const colorAttachments = defaultValue(options.colorAttachments, [ colorTexture ]);

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  // color
  gl.activeTexture(gl.TEXTURE0);
  const colorAttachmentsLength = colorAttachments.length;
  if (colorAttachmentsLength > 1) {
    const ext = gl.getExtension('WebGL_draw_buffers');
    const drawBuffers = [];
    for (let i = 0; i < colorAttachmentsLength; i++) {
      drawBuffers.push(ext.COLOR_ATTACHMENT0_WEBGL + i);
    }
    ext.drawBuffersWEBGL(drawBuffers);

    for (let i = 0; i < colorAttachmentsLength; i++) {
      const colorAttachment = colorAttachments[i];
      gl.bindTexture(gl.TEXTURE_2D, colorAttachment);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, colorAttachment, 0);
    }
  } else {
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);

  // depth
  if (depthTexture) {
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  else if (depthRenderbuffer) {
    const renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, depthRenderbuffer.width, depthRenderbuffer.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  }

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('createFramebuffer: framebuffer combination is NOT completed! Current status is ' + FRAMEBUFFER_STATUS[status] + '.');
  }

  return fb;
}

export default createFramebuffer;
