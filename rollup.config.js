import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser  } from 'rollup-plugin-terser';
import typescript2 from 'rollup-plugin-typescript2';
import { string } from 'rollup-plugin-string';

const banner = `
/*
 * @license Copyright (c) 2021 - ${new Date().getFullYear()}, Venus All Rights Reserved.
 * Available via the MIT license.
 */
`;

export default {
  input: 'lib/index.ts',
  output: [
    {
      sourcemap: true,
      name: 'ToyGL',
      file: 'dist/toygl.js',
      format: 'umd',
      banner: banner,
    },
    // {
    //   name: 'ToyGL',
    //   file: 'dist/toygl.min.js',
    //   format: 'umd',
    //   banner: banner,
    //   sourcemap: true,
    //   plugins: [ terser({
    //     output: {
    //       comments: function (node, comment) {
    //         var text = comment.value;
    //         var type = comment.type;
    //         if (type == "comment2") {
    //           // multiline comment
    //           return /@preserve|@license|@cc_on/i.test(text);
    //         }
    //       },
    //     },
    //   }) ],
    // },
    // {
    //   name: 'ToyGL',
    //   file: 'dist/toygl.esm.js',
    //   format: 'esm',
    //   banner: banner,
    // },
    // {
    //   name: 'ToyGL',
    //   file: 'dist/toygl.esm.min.js',
    //   format: 'esm',
    //   banner: banner,
    //   sourcemap: true,
    //   plugins: [ terser({
    //     output: {
    //       comments: function (node, comment) {
    //         var text = comment.value;
    //         var type = comment.type;
    //         if (type == "comment2") {
    //           // multiline comment
    //           return /@preserve|@license|@cc_on/i.test(text);
    //         }
    //       },
    //     },
    //   }) ],
    // },
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    string({
      include: "**/*.glsl",
    }),
    typescript2({
      tsconfig: 'tsconfig.json',
      // tsconfigOverride: {
      //   compilerOptions: {
      //       sourceMap: true,
      //       inlineSourceMap: false,
      //       module: "ES2015"
      //   }
      // }
    })
  ],
  watch: {
    include: 'lib/**',
    exclude: 'node_modules/**',
  }
};
