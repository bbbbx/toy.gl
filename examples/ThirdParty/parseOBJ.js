function parseOBJ(text) {
  const positions = [];
  const colors = [];
  const texcoords = [];
  const normals = [];
  const mtllib = [];

  const objects = {
    defaultObject: {
      defaultGroup: {
        defaultMaterial: {
          triangles: {
            positionIndices: [],
            texcoordIndices: [],
            normalIndices: [],
          },
          lines: {
            positionIndices: [],
            texcoordIndices: [],
          },
        },
      },
    },
  };

  let currentObjectName = 'defaultObject';
  let currentGroupName = 'defaultGroup';
  let currentMaterialName = 'defaultMaterial';

  function addIndices(part, target) {
    // part = 'position/uv/normal'
    const pnts = part.split('/');

    const idx = parseInt(pnts[0], 10);

    // 因为 .obj 的索引是从 1 开始的，所以要 -1，
    // 索引也可以是负的。
    const positionIndex = idx > 0 ? idx - 1 : positions.length / 3 + idx;

    objects[currentObjectName][currentGroupName][currentMaterialName][target].positionIndices.push(positionIndex);

    if (pnts[1]) {
      let texcoordIndex = parseInt(pnts[1], 10);
      texcoordIndex = texcoordIndex > 0 ? texcoordIndex - 1 : texcoords.length / 2 + texcoordIndex;
      objects[currentObjectName][currentGroupName][currentMaterialName][target].texcoordIndices.push(texcoordIndex);
    }

    // l v1/vt1 v2/vt2 ...
    // 没有法线
    if (pnts[2] && target !== 'lines') {
      let normalIndex = parseInt(pnts[2], 10);
      normalIndex = normalIndex > 0 ? normalIndex - 1 : normals.length / 3 + normalIndex;
      objects[currentObjectName][currentGroupName][currentMaterialName][target].normalIndices.push(normalIndex);
    }
  }

  const keywords = {
    v(parts) {
      const componentLength = parts.length;

      // `v x y z` 或 `v x y z w`
      // 忽略 `w` 分量，因为它是曲线或曲面的权重值。
      if (componentLength === 3 || componentLength === 4) {
        positions.push(...parts.slice(0, 3).map(parseFloat));
      }

      // v x y z r g b
      if (componentLength === 6) {
        positions.push(...parts.slice(0, 3).map(parseFloat));
        colors.push(...parts.slice(3, 6).map(parseFloat));
      }
    },
    vt(parts, unparsedArgs) {
      if (parts.length < 2) {
        console.error(
          `parseOBJ: "vt" with fewer than 2 components will be ignored. Source text: "vt ${unparsedArgs}"`
        );
        return;
      }

      texcoords.push(...parts.slice(0, 2).map(parseFloat));
    },
    vn(parts, unparsedArgs) {
      if (parts.length < 3) {
        console.error(
          `parseOBJ: "vn" with fewer than 3 components will be ignored. Source text: "vn ${unparsedArgs}"`
        );
        return;
      }

      normals.push(...parts.slice(0, 3).map(parseFloat));
    },
    f(parts, unparsedArgs) {
      if (parts.length < 3) {
        console.error(
          `parseOBJ: "f" with fewer than 3 vertices will be ignored. Source text: "f ${unparsedArgs}"`
        );
        return;
      }

      const target = 'triangles';
      const numOfTriangles = parts.length - 2;
      for (let i = 0; i < numOfTriangles; ++i) {
        addIndices(parts[0], target);
        addIndices(parts[i + 1], target);
        addIndices(parts[i + 2], target);
      }
    },
    l(parts, unparsedArgs) {
      if (parts.length < 2) {
        console.error(
          `parseOBJ: "l" with fewer than 2 vertices will be ignored. Source text: "l ${unparsedArgs}"`
        );
        return;
      }

      const target = 'lines';
      const numOfLines = parts.length - 1;
      for (let i = 0; i < numOfLines; ++i) {
        addIndices(parts[i], target);
        addIndices(parts[i + 1], target);
      }
    },
    o(parts) {
      currentObjectName = parts[0];

      if (!objects[currentObjectName]) {
        objects[currentObjectName] = {
          defaultGroup: {
            defaultMaterial: {
              triangles: {
                positionIndices: [],
                texcoordIndices: [],
                normalIndices: [],
              },
              lines: {
                positionIndices: [],
                texcoordIndices: [],
              },
            },
            [currentMaterialName]: {
              triangles: {
                positionIndices: [],
                texcoordIndices: [],
                normalIndices: [],
              },
              lines: {
                positionIndices: [],
                texcoordIndices: [],
              },
            },
          },
        };
      }
    },
    // g group_name1 group_name2
    g(parts, unparsedArgs) {
      if (parts.length === 0) {
        return;
      }

      // TODO: 支持多个 group name？
      currentGroupName = unparsedArgs;

      if (!objects[currentObjectName][currentGroupName]) {
        objects[currentObjectName][currentGroupName] = {
          [currentMaterialName]: {
            triangles: {
              positionIndices: [],
              texcoordIndices: [],
              normalIndices: [],
            },
            lines: {
              positionIndices: [],
              texcoordIndices: [],
            },
          },
        };
      }

      if (!objects[currentObjectName][currentGroupName][currentMaterialName]) {
        objects[currentObjectName][currentGroupName][currentMaterialName] = {
          triangles: {
            positionIndices: [],
            texcoordIndices: [],
            normalIndices: [],
          },
          lines: {
            positionIndices: [],
            texcoordIndices: [],
          },
        };
      }
    },
    s() {
      // 忽略
    },
    usemtl(parts, unparsedArgs) {
      currentMaterialName = unparsedArgs;

      if (!objects[currentObjectName][currentGroupName][currentMaterialName]) {
        objects[currentObjectName][currentGroupName][currentMaterialName] = {
          triangles: {
            positionIndices: [],
            texcoordIndices: [],
            normalIndices: [],
          },
          lines: {
            positionIndices: [],
            texcoordIndices: [],
          },
        };
      }
    },
    mtllib(parts) {
      mtllib.push(...parts);
    },
  };

  const keywordRE = /(\w*)(?: )*(.*)/;

  const lines = text.split('\n');

  for (let lineNo = 0, len = lines.length; lineNo < len; lineNo++) {
    const line = lines[lineNo].trim();

    if (line === '' || line.startsWith('#')) {
      continue;
    }

    const m = keywordRE.exec(line);
    if (!m) {
      continue;
    }

    const [, keyword, unparsedArgs] = m;
    const parts = line.split(/\s+/).slice(1);

    const handler = keywords[keyword];

    if (!handler) {
      console.warn('parseOBJ: can not handle', keyword, 'at line', lineNo + 1);
      continue;
    }

    handler(parts, unparsedArgs);
  }

  return {
    positions,
    colors: colors.length > 0 ? colors : undefined,
    texcoords: texcoords.length > 0 ? texcoords : undefined,
    normals: normals.length > 0 ? normals : undefined,
    objects,
    mtllib: mtllib.length > 0 ? mtllib : undefined,
  };
};
