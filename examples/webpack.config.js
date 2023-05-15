const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    hello: './hello/index.ts',
    // cubemap: './next/cubemap/index.ts',
    mvp: './next/mvp/index.ts',
    // SkyAtmosphere: './SkyAtmosphere/index.ts',
  },
  output: {
    filename: '[name]/[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {}
          }
        ]
      },
      {
        test: /\.(frag|vert|glsl|gltf)$/,
        type: 'asset/source',
      },
      {
        test: /\.(hdr|png|jpeg|jpg|glb)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.frag', '.vert', '.glsl', '.hdr']
  },
  plugins: [],
};

for (const entryName in module.exports.entry) {
  if (module.exports.entry.hasOwnProperty(entryName)) {
    module.exports.plugins.push(new HtmlWebpackPlugin({
      title: entryName,
      filename: `${entryName}/index.html`,
      chunks: [entryName],
      template: 'template.html',
    }))
  }
}
