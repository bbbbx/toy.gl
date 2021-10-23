import { createAttributeBuffer, createIndicesBuffer } from "./buffer.js";
import defined from "./defined.js";

/**
 * Create a vertex array object. You can imagine it like this
 * <pre>
 * var glState = {
 *   attributeState: {
 *     ELEMENT_ARRAY_BUFFER: null,
 *     attributes: [
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *       { enable: ?, size: ?, type: ?, normalize: ?, stride: ?, offset: ?, buffer: ?, },
 *     ],
 *   },
 * </pre>
 * @param {WebGLRenderingContext|WebGL2RenderingContext} gl 
 * @param {Object} options 
 * @param {Object} options.attributes The key of Object is vertex attribute name, value is a Object, it includes <code>location</code>, <code>size</code> and <code>data</code> property, for example:
 * <pre>
 * {
 *   a_pos: {
 *     location: 0,
 *     size: 3,
 *     data: [
 *       0, 0, 0,
 *       1, 1, 1,
 *       0, 1, 0,
 *     ]
 *   }
 * }
 * </pre>
 * @param {Object} options.indices ELEMENT_ARRAY_BUFFER of vertex array.
 * @returns {WebGLVertexArrayObjectOES}
 */
function createVAO(gl, options) {
  let ext;
  let vao;

  if (gl instanceof WebGLRenderingContext) {
    ext = gl.getExtension('OES_vertex_array_object');
    if (!ext) {
      throw new Error('Your device does not support VAO(OES_vertex_array_object extension), try to use vertex attributes.');
    }

    vao = ext.createVertexArrayOES();
    ext.bindVertexArrayOES(vao);
  } else if (gl instanceof WebGL2RenderingContext) {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
  } else {
    throw new Error('gl MUST be instance of WebGLRenderingContext or WebGL2RenderingContext.');
  }

  const attributes = options.attributes;
  const indices = options.indices;

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

  if (defined(indices)) {
    const indicesBuffer = createIndicesBuffer(gl, indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
  }

  if (gl instanceof WebGLRenderingContext) {
    ext.bindVertexArrayOES(null);
  } else if (gl instanceof WebGL2RenderingContext) {
    gl.bindVertexArray(null);
  }

  return vao;
}

export default createVAO;