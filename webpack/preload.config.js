const { merge } = require('webpack-merge');
const baseConfig = require('./base.config.js');

const plugins = [];

module.exports = merge(baseConfig, {
  entry: ['./src/desktop/preload/index.mjs'],
  output: {
    filename: 'preload.bundle.js',
  },

  /* prevent evaluation of __dirname and __filename at build time in
   * launcher and preloader */
  node: {
    __dirname: false,
    __filename: false,
  },

  plugins,

  target: 'electron-renderer',
});
