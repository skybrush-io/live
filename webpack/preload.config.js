var merge = require('webpack-merge')
var baseConfig = require('./base.config.js')

module.exports = merge.smart(baseConfig, {
  entry: './src/desktop/preload/index.js',
  output: {
    filename: 'preload.bundle.js'
  },

  node: {
    __dirname: false,
    __filename: false
  },

  plugins: [],

  target: 'electron-renderer'
})
