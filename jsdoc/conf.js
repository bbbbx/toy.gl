'use strict';

module.exports = {
  plugins: ['plugins/markdown'],
  source: {
    include: [ 'src' ],
    includePattern: '.+\\.js$',
  },
  sourceType: 'module',
  tags: {
    allowUnknownTags: false,
    dictionaries: ['jsdoc','closure'],
  },
  templates: {
    cleverLinks: true,
    default: {
      outputSourceFiles: false
    },
    sourceUrl: 'https://github.com/bbbbx/toy.gl/blob/{version}/src/{filename}',
  },
  opts: {
    template: './jsdoc/cesium_template',
    destination: 'docs',
    recurse: true,
  },
};
