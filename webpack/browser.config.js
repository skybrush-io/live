var merge = require('webpack-merge')
var baseConfig = require('./base.config.js')

module.exports = merge.smart(baseConfig, {
  entry: ['@babel/polyfill', './src/index'],
  output: {
    filename: 'bundle.js'
  }
})
