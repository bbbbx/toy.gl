function Mesh(options) {
  this.positions = options.positions;
  this.uvs = options.uvs;
  this.normals = options.normals;
  this.indices = options.indices;
  this.vao = undefined;
  this.numberOfVertices = options.positions.length / 3;

  this.texture = undefined
}

Mesh.prototype.update = function(gl) {

  if (typeof Mesh.whiteTexture === 'undefined') {
    Mesh.whiteTexture = ToyGL.createTexture(gl, {
      data: new Uint8Array([255, 255, 255, 255]),
      width: 1,
      height: 1,
      internalFormat: gl.RGBA,
      type: gl.UNSIGNED_BYTE,
      format: gl.RGBA,
    });
  }

  if (typeof this.texture === 'undefined') {
    this.texture = Mesh.whiteTexture;
  }

  this.buildVAO(gl);
};

Mesh.prototype.buildVAO = function(gl) {
  if (this.vao) {
    return;
  }

  this.vao = ToyGL.createVAO(gl, {
    attributes: {
      a_position: {
        location: attributeLocations.a_position,
        size: 3,
        data: this.positions,
      },
      a_uv: {
        location: attributeLocations.a_uv,
        size: 2,
        data: this.uvs,
      },
      a_normal: {
        location: attributeLocations.a_normal,
        size: 3,
        data: this.normals,
      },
    },
    indices: this.indices,
  });
};