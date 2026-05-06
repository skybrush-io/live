const webpack = require('webpack');
const { merge } = require('webpack-merge');
const baseConfig = require('./base.config.js');
const { outputDir } = require('./helpers');

module.exports = merge(baseConfig, {
  entry: ['./src/desktop/preload/index.mjs'],
  output: {
    path: outputDir,
    filename: 'preload.bundle.js',
  },

  /* prevent evaluation of __dirname and __filename at build time in
   * launcher and preloader */
  node: {
    __dirname: false,
    __filename: false,
  },

  plugins: [
    new webpack.DefinePlugin({
      '__IS_PRODUCTION__': process.env.NODE_ENV === 'production',
    }),
  ],

  target: 'electron-renderer',
});
