const { merge } = require('webpack-merge');
const baseConfig = require('./base.config.js');

const plugins = [];

module.exports = merge(baseConfig, {
  entry: './launcher.js',
  output: {
    filename: 'launcher.bundle.js',
  },

  node: {
    __dirname: false,
    __filename: false,
  },

  plugins,

  target: 'electron-main',
});
