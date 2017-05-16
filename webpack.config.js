// Use strict mode so we can have block-scoped declarations
'use strict'

// Import the promise polyfill for ye olde Node installations
require('es6-promise').polyfill()

// Don't use let in the line below because older Node.js versions on Linux
// will not like it
var path = require('path')
var webpack = require('webpack')

var enableSourceMap = false

module.exports = {
  devtool: enableSourceMap ? 'inline-source-map' : 'eval',
  entry: './src/index',
  output: {
    devtoolModuleFilenameTemplate: '/[absolute-resource-path]',
    filename: 'bundle.js',
    path: path.join(__dirname, 'build'),
    publicPath: '/static/'
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),

    // The next module is needed for golden-layout to work nicely
    new webpack.ProvidePlugin({
      ReactDOM: 'react-dom',
      React: 'react'
    })
  ],
  resolve: {
    alias: {
      config: path.join(__dirname, 'config', process.env.NODE_ENV || 'production')
    },
    extensions: ['.webpack.js', '.web.js', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      },
      {
        test: /\.jsx?$/,
        use: [
          { loader: 'babel-loader' }
        ],
        include: [
          path.join(__dirname, 'config'),
          path.join(__dirname, 'src')
        ]
      },
      {
        test: /\.less$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'less-loader' }
        ],
        include: path.join(__dirname, 'assets', 'css')
      },
      {
        test: /\.(png|jpg)$/,
        use: [
          { loader: 'url-loader?limit=8192' }
        ],
        include: path.join(__dirname, 'assets')
      }
    ],
    noParse: /dist\/ol.js/
  }
}
