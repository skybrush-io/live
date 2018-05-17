var merge = require('webpack-merge')
var WebpackShellPlugin = require('webpack-shell-plugin')
var baseConfig = require('./base.config.js')
var nodeNative = require('./helpers').nodeNative

var enableSourceMap = false

var plugins = []

/* In dev mode, also run Electron and let it load the live bundle */
if (process.env.NODE_ENV !== 'production') {
  plugins.push(
    new WebpackShellPlugin({
      onBuildEnd: ['electron launcher.js'],
      dev: true
    })
  )
}

module.exports = merge.smart(baseConfig, {
  devtool: enableSourceMap ? 'inline-source-map' : false,

  output: {
    filename: 'bundle.js'
  },

  resolve: {
    alias: {
      '@dns': nodeNative('dns'),
      '@path': nodeNative('path'),
      '@redux-storage-engine$': 'redux-storage-engine-electron-store',
      '@ssdp': 'node-ssdp-lite',
      '@which': 'which'
    }
  },

  /* hide the ws module -- we will be using the native WebSockets module from
   * the browser env */
  externals: ['ws'],

  plugins: plugins,

  target: 'electron-renderer'
})
