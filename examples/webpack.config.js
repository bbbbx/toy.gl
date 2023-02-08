const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    hello: './hello/index.ts',
  },
  output: {
    filename: '[name]/[name].[contenthash].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'development',
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
        test: /\.(frag|vert)$/,
        type: 'asset/source',
      },
      {
        test: /\.(hdr|png)$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.frag', '.vert', 'hdr']
  },
  plugins: [
    // new HtmlWebpackPlugin({
    //   title: 'Hello',
    //   filename: 'hello/index.html',
    //   chunks: ['hello'],
    //   template: 'index.html',
    // }),
    // new HtmlWebpackPlugin({
    //   title: 'Hello2',
    //   filename: 'hello2/index.html',
    //   chunks: ['hello2'],
    //   template: 'index.html',
    // }),
  ],
};


for (const entryName in module.exports.entry) {
  if (module.exports.entry.hasOwnProperty(entryName)) {
    module.exports.plugins.push(new HtmlWebpackPlugin({
      title: entryName,
      filename: `${entryName}/index.html`,
      chunks: [entryName],
      template: 'index.html',
    }))
  }
}