var merge = require('webpack-merge')
var baseConfig = require('./base.config.js')

var enableSourceMap = false

var mock = require('./helpers').mock

module.exports = merge.smart(baseConfig, {
  devtool: enableSourceMap ? 'inline-source-map' : false,
  output: {
    filename: 'bundle.js'
  },
  resolve: {
    alias: {
      '@which': mock('which')
    }
  }
})
