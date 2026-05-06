const webpack = require('webpack');
const { merge } = require('webpack-merge');
const baseConfig = require('./base.config.js');
const { outputDir } = require('./helpers');

module.exports = merge(baseConfig, {
  entry: './launcher.mjs',
  experiments: {
    outputModule: true,
  },
  externals: {
    'electron/common': 'electron/common',
    'electron/main': 'electron/main',
  },
  externalsType: 'module',
  output: {
    path: outputDir,
    filename: 'launcher.bundle.mjs',
    module: true,
  },

  /* prevent evaluation of __dirname and __filename at build time in
   * launcher and preloader */
  node: {
    __dirname: false,
    __filename: false,
  },

  plugins: [
    new webpack.DefinePlugin({
      'import.meta.url': '"file:///"',
      '__IS_PRODUCTION__': process.env.NODE_ENV === 'production',
    }),
  ],

  target: 'electron39-main',
});
