var merge = require('webpack-merge')
var baseConfig = require('./base.config.js')

var enableSourceMap = false

var mock = require('./helpers').mock

module.exports = merge.smart(baseConfig, {
  devtool: enableSourceMap ? 'inline-source-map' : 'eval',
  output: {
    filename: 'bundle.js'
  },
  resolve: {
    alias: {
      '@dns': mock('dns'),
      '@redux-storage-engine$': 'redux-storage-engine-localstorage',
      '@ssdp': mock('ssdp'),
      '@which': mock('which')
    }
  }
})
