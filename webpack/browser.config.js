var path = require('path')
var merge = require('webpack-merge')
var baseConfig = require('./base.config.js')

var enableSourceMap = false

var projectRoot = require('./helpers').projectRoot

module.exports = merge.smart(baseConfig, {
  devtool: enableSourceMap ? 'inline-source-map' : 'eval',
  output: {
    filename: 'bundle.js'
  },
  resolve: {
    alias: {
      '@redux-storage-engine$': 'redux-storage-engine-localstorage',
      '@ssdp': path.resolve(projectRoot, 'src', 'mocks', 'ssdp')
    }
  }
})
