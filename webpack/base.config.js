// Use strict mode so we can have block-scoped declarations
'use strict'

// Import the promise polyfill for ye olde Node installations
require('es6-promise').polyfill()

// Don't use let in the line below because older Node.js versions on Linux
// will not like it
var path = require('path')
var webpack = require('webpack')
var Dotenv = require('dotenv-webpack')

var projectRoot = require('./helpers').projectRoot

module.exports = {
  entry: './src/index',
  mode: 'development',
  output: {
    devtoolModuleFilenameTemplate: '/[absolute-resource-path]',
    path: path.join(projectRoot, 'build'),
    publicPath: '/build/'
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),

    // The next module is needed for golden-layout to work nicely
    new webpack.ProvidePlugin({
      ReactDOM: 'react-dom',
      React: 'react'
    }),

    // Resolve process.env.NODE_ENV in the code
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),

    // Add environment variables from .env
    new Dotenv()
  ],
  resolve: {
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
          path.join(projectRoot, 'config'),
          path.join(projectRoot, 'src')
        ]
      },
      {
        test: /\.less$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'less-loader' }
        ],
        include: path.join(projectRoot, 'assets', 'css')
      },
      {
        test: /\.(png|jpg)$/,
        use: [
          { loader: 'url-loader?limit=8192' }
        ],
        include: path.join(projectRoot, 'assets')
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        use: [
          { loader: 'file-loader' }
        ]
      }
    ],
    noParse: [/dist\/ol.*\.js/]
  },

  /* no need for bundle size warnings */
  performance: { hints: false }
}
