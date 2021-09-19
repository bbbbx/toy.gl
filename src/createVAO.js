import { createAttributeBuffer } from "./buffer.js";

function createVAO(gl, options) {
  const ext = gl.getExtension('OES_vertex_array_object');
  if (!ext) {
    throw new Error('Your device does not support VAO(OES_vertex_array_object extension), try to use vertex attributes.');
  }

  const attributes = options.attributes;

  const vao = ext.createVertexArrayOES();
  ext.bindVertexArrayOES(vao);

  for (const attributeName in attributes) {
    if (Object.hasOwnProperty.call(attributes, attributeName)) {
      const { location, data, size } = attributes[attributeName];

      const buffer = createAttributeBuffer(gl, data, gl.STATIC_DRAW);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(location);

      const type = gl.FLOAT;
      const normalized = false;
      const stride = 0;
      const offset = 0;
      gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
    }
  }

  ext.bindVertexArrayOES(null);

  return vao;
}

export default createVAO;