var merge = require('webpack-merge')
var baseConfig = require('./base.config.js')
var projectRoot = require('./helpers').projectRoot

var enableSourceMap = false

module.exports = merge.smart(baseConfig, {
  devtool: enableSourceMap ? 'inline-source-map' : 'eval',

  entry: './launcher.js',
  output: {
    filename: 'launcher.bundle.js'
  },

  node: {
    __dirname: false,
    __filename: false
  },

  plugins: [],

  // prevent warnings arising from the usage of require() in yargs
  stats: { warnings: false },

  target: 'electron-main'
})
