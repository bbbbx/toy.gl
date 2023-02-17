function demodernizeShader(input: string, isFragmentShader: boolean): string {
  let output = input;

  // Remove version string got GLSL 3.00
  output = output.replaceAll(/#version\s+300\s+es/g, '');

  output = output.replaceAll(
    /(texture\()/g,
    'texture2D(' // Trailing ')' is included in the match group.
  );

  if (isFragmentShader) {
    // Replace the in with varying
    output = output.replaceAll(/(in)\s+(vec\d|mat\d|float)/g, 'varying $2');

    if (/out_FragData_(\d+)/.test(output)) {
      output = `#extension GL_EXT_draw_buffers: enabled\n${output}`;

      // Remove all layout declarations for out_FragData_n
      output = output.replaceAll(/layout\s*\(location\s*=\s*\d+\)\s*out\s+vec4\s+out_FragData_\d+;/g, '');

      // Replace output_FragData_n with gl_FragData[n]
      output = output.replaceAll(/out_FragData_(\d+)/g, 'gl_FragData[$1]');
    }

    // Replace out_FragColor[n] with gl_FragColor[n].
    // output = output.replaceAll(/out_FragColor/g, 'gl_FragColor');
    // output = output.replaceAll(/out_FragColor\[(\d+)\]/g, 'gl_FragColor[$1]');

    // Remove all layout declarations for out_FragColor.
    // output = output.replaceAll(/layout\s+\(location\s*=\s*0\)\s*out\s+vec4\s+out_FragColor;/g, '');

    let hasMultiDrawBuffers = false;
    const fragmentOutputVariables = [];
    output = output.replace(/layout\s+\(location\s*=\s*(\d+)\)\s*out\s+vec4\s+(\w+);/g, function (match, location, name) {
      if (location > 0) {
        hasMultiDrawBuffers = true;
      }

      fragmentOutputVariables[location] = name;
      return '';
    });

    if (fragmentOutputVariables.length > 0) {
      if (hasMultiDrawBuffers) {
        for (let location = 0; location < fragmentOutputVariables.length; location++) {
          const variableName = fragmentOutputVariables[location];
          output = output.replaceAll(variableName, `gl_FragData[${location}]`);
        }
      } else {
        output = output.replaceAll(fragmentOutputVariables[0], `gl_FragColor`);
      }
    }

    if (/gl_FragDepth(?!EXT)/.test(output)) {
      output = `#extension GL_EXT_frag_depth : enable\n${output}`;
      // Replace gl_FragDepth with gl_FragDepthEXT.
      output = output.replaceAll(/gl_FragDepth(?!EXT)/g, 'gl_FragDepthEXT');
    }
  } else {
    // Replace the in with attribute
    output = output.replaceAll(/(in)\s+(vec\d|mat\d|float)/g, 'attribute $2');

    // Replace the out with varying
    output = output.replaceAll(/(out)\s+(vec\d|mat\d|float)\s+([\w]+);/g, 'varying $2 $3;');
  }

  // Add version string for GLSL 1.00
  output = `#version 100\n${output}`;

  return output;
}

export default demodernizeShader;
