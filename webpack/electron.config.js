var merge = require('webpack-merge')
var baseConfig = require('./base.config.js')

var enableSourceMap = false

module.exports = merge.smart(baseConfig, {
  devtool: enableSourceMap ? 'inline-source-map' : 'eval',

  output: {
    filename: 'bundle.js'
  },

  resolve: {
    alias: {
      '@redux-storage-engine$': 'redux-storage-engine-electron-store'
    }
  },

  /* hide the ws module -- we will be using the native WebSockets module from
   * the browser env */
  externals: ['ws'],

  target: 'electron-renderer'
})
