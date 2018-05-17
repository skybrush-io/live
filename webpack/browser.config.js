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
      'electron': mock('electron'),
      '@dns': mock('dns'),
      '@path': 'path-browserify',
      '@redux-storage-engine$': 'redux-storage-engine-localstorage',
      '@ssdp': mock('ssdp'),
      '@which': mock('which')
    }
  }
})
