function parseMTL(text) {
  const materials = {};
  let currentMaterialName = '';

  const keywords = {
    newmtl(parts, unparsedArgs) {
      const materialName = unparsedArgs;
      materials[materialName] = {};
      currentMaterialName = materialName;
    },
    Ka(parts) {
      materials[currentMaterialName].Ka = parts.map(parseFloat);
    },
    Kd(parts) {
      materials[currentMaterialName].Kd = parts.map(parseFloat);
    },
    // The specular color is declared using Ks, and weighted using the specular exponent Ns.
    Ks(parts) {
      // 镜面反射颜色
      materials[currentMaterialName].Ks = parts.map(parseFloat);
    },
    Ns(parts) {
      // 镜面反射指数，[0, 1000]
      materials[currentMaterialName].Ns = parseFloat(parts[0]);
    },
    // emissive
    Ke(parts) {
      materials[currentMaterialName].Ke = parts.map(parseFloat);
    },
    map_Ka(parts) {
      materials[currentMaterialName].map_Ka = parts[0];
    },
    map_Kd(parts) {
      materials[currentMaterialName].map_Kd = parts[0];
    },
    map_Ks(parts) {
      materials[currentMaterialName].map_Ks = parts[0];
    },
    map_Ke(parts) {
      materials[currentMaterialName].map_Ke = parts[0];
    },
    bump(parts) {
      materials[currentMaterialName].bump = parts[0];
    },
    map_bump(parts) {
      materials[currentMaterialName].map_bump = parts[0];
    },
    // dissolved。1.0 表示完全不透明
    d(parts) {
      materials[currentMaterialName].d = parseFloat(parts[0]);
    },
    // Tr = 1 - d
    Tr(parts) {
      materials[currentMaterialName].Tr = parseFloat(parts[0]);
    },
    map_d(parts) {
      materials[currentMaterialName].map_d = parts[0];
    },
    // Transmission Filter Color
    Tf(parts) {
      materials[currentMaterialName].Tf = parts.map(parseFloat);
    },
    // index of refraction（折射率） or optical density
    Ni(parts) {
      materials[currentMaterialName].Ni = parseFloat(parts[0]);
    },
    // 照明模式
    illum(parts) {
      // 0. Color on and Ambient off
      // 1. Color on and Ambient on
      // 2. Highlight on
      // 3. Reflection on and Ray trace on
      // 4. Transparency: Glass on, Reflection: Ray trace on
      // 5. Reflection: Fresnel on and Ray trace on
      // 6. Transparency: Refraction on, Reflection: Fresnel off and Ray trace on
      // 7. Transparency: Refraction on, Reflection: Fresnel on and Ray trace on
      // 8. Reflection on and Ray trace off
      // 9. Transparency: Glass on, Reflection: Ray trace off
      // 10. Casts shadows onto invisible surfaces

      materials[currentMaterialName].illum = parseFloat(parts[0]);
    },
  };

  const lines = text.split('\n');

  const keywordRE = /(\w*)(?: )*(.*)/;

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
      console.warn('parseMTL: can not handle', keyword, 'at line', lineNo + 1);
      continue;
    }

    handler(parts, unparsedArgs);
  }

  return materials;
};
