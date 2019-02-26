var merge = require('webpack-merge')
var baseConfig = require('./base.config.js')

module.exports = merge.smart(baseConfig, {
  entry: ['@babel/polyfill', './launcher.js'],
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
