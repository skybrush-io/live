const { merge } = require('webpack-merge');
const baseConfig = require('./base.config.js');

const plugins = [];

module.exports = merge(baseConfig, {
  entry: ['./src/desktop/preload/index.js'],
  output: {
    filename: 'preload.bundle.js',
  },

  node: {
    __dirname: false,
    __filename: false,
  },

  plugins,

  target: 'electron-renderer',
});
