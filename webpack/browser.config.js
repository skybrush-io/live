var merge = require('webpack-merge')
var baseConfig = require('./base.config.js')

module.exports = merge.smart(baseConfig, {
  entry: './src/index',
  output: {
    filename: 'bundle.js'
  }
})
