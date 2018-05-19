var merge = require('webpack-merge')
var baseConfig = require('./base.config.js')

var enableSourceMap = false

module.exports = merge.smart(baseConfig, {
  devtool: enableSourceMap ? 'inline-source-map' : false,

  entry: './src/index',
  output: {
    filename: 'bundle.js'
  }
})
