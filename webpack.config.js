// Use strict mode so we can have block-scoped declarations
'use strict'

// Import the promise polyfill for ye olde Node installations
require('es6-promise').polyfill()

// Don't use let in the line below because older Node.js versions on Linux
// will not like it
var path = require('path')

module.exports = {
  devtool: 'eval',
  entry: './src/index.jsx',
  output: {
    filename: './dist/bundle.js'
  },
  resolve: {
    alias: {
      config: path.join(__dirname, 'config', process.env.NODE_ENV || 'production')
    },
    extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx']
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      { test: /\.less$/, loader: 'style-loader!css-loader!less-loader' },
      { test: /\.(png|jpg)$/, loader: 'url-loader?limit=8192' }
    ],
    noParse: /dist\/ol.js/
  }
}
