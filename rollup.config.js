import { terser  } from 'rollup-plugin-terser';

const banner = `
/*
 * @license Copyright (c) 2021, Venus All Rights Reserved.
 * Available via the MIT license.
 */
`;

export default {
  input: 'src/index.js',
  output: [
    {
      name: 'ToyGL',
      file: 'dist/toygl.js',
      format: 'iife',
      banner: banner,
    },
    {
      name: 'ToyGL',
      file: 'dist/toygl.esm.js',
      format: 'esm',
      banner: banner,
    },
    {
      name: 'ToyGL',
      file: 'dist/toygl.min.js',
      format: 'iife',
      banner: banner,
      plugins: [ terser({
        output: {
          comments: function (node, comment) {
            var text = comment.value;
            var type = comment.type;
            if (type == "comment2") {
              // multiline comment
              return /@preserve|@license|@cc_on/i.test(text);
            }
          },
        },
      }) ],
    },
    {
      name: 'ToyGL',
      file: 'dist/toygl.esm.min.js',
      format: 'esm',
      banner: banner,
      plugins: [ terser({
        output: {
          comments: function (node, comment) {
            var text = comment.value;
            var type = comment.type;
            if (type == "comment2") {
              // multiline comment
              return /@preserve|@license|@cc_on/i.test(text);
            }
          },
        },
      }) ],
    },
  ],
  watch: {
    // clearScreen: false,
    include: 'src/**',
    exclude: 'node_modules/**',
  }
};
