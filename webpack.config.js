const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => ({
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]',
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  optimization:
    argv.mode === 'production'
      ? {
          minimize: true,
          minimizer: [
            new TerserPlugin({
              terserOptions: {
                keep_fnames: /^(HTML|SVG)/, // https://github.com/fgnass/domino/issues/144,
                compress: {
                  passes: 2,
                },
              },
            }),
          ],
        }
      : undefined,
  plugins: [
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
    new webpack.IgnorePlugin({ resourceRegExp: /canvas|bufferutil|utf-8-validate/ }),
  ],
});
