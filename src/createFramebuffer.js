import defaultValue from './defaultValue.js';

const FRAMEBUFFER_STATUS = {
  36053: 'FRAMEBUFFER_COMPLETE',
  36054: 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT',
  36055: 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT',
  36057: 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS',
  36061: 'FRAMEBUFFER_UNSUPPORTED',
};

function createFramebuffer(gl, options) {
  const { colorTexture, depthTexture, depthRenderbuffer } = options;
  const colorAttachments = defaultValue(options.colorAttachments, [ colorTexture ])

  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  // color
  const colorAttachmentsLength = colorAttachments.length;
  if (colorAttachmentsLength > 1) {
    const ext = gl.getExtension('WebGL_draw_buffers');
    ext.drawBuffersWEBGL([
      ext.COLOR_ATTACHMENT0_WEBGL,
      ext.COLOR_ATTACHMENT1_WEBGL,
    ]);

    for (let i = 0; i < colorAttachmentsLength; i++) {
      const colorAttachment = colorAttachments[i];
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, colorAttachment);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, colorAttachment, 0);
    }
  } else {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
  }
  

  // depth
  if (depthTexture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, depthTexture);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
  }
  else if (depthRenderbuffer) {
    const renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, depthRenderbuffer.width, depthRenderbuffer.height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);
  }

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error('createFramebuffer: framebuffer combination is NOT completed! Current status is ' + FRAMEBUFFER_STATUS[status] + '.');
  }

  return fb;
}

export default createFramebuffer;
