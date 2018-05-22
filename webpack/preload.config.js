var merge = require('webpack-merge')
var baseConfig = require('./base.config.js')

var enableSourceMap = false

module.exports = merge.smart(baseConfig, {
  devtool: enableSourceMap ? 'inline-source-map' : false,

  entry: './src/desktop/preload.js',
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
