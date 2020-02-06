// Use strict mode so we can have block-scoped declarations
'use strict';

// Import the promise polyfill for ye olde Node installations
require('es6-promise').polyfill();

// Don't use let in the line below because older Node.js versions on Linux
// will not like it
const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

const { projectRoot } = require('./helpers');

const enableSourceMap = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: 'development',
  output: {
    path: path.join(projectRoot, 'build'),
    publicPath: '/build/'
  },
  devtool: enableSourceMap ? 'cheap-module-source-map' : undefined,
  devServer: {
    hot: true
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
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development'
      ),
      'process.env.DEPLOYMENT': JSON.stringify(process.env.DEPLOYMENT || '0')
    }),

    // Add environment variables from .env
    new Dotenv()
  ],
  resolve: {
    alias: {
      '~': path.resolve(projectRoot, 'src')
    },
    extensions: ['.webpack.js', '.web.js', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
      },
      {
        test: /\.jsx?$/,
        use: [{ loader: 'babel-loader' }],
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
        use: [{ loader: 'url-loader', options: { limit: 8192 } }],
        include: path.join(projectRoot, 'assets')
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg)$/,
        use: [{ loader: 'file-loader' }]
      }
    ],
    noParse: [/dist\/ol.*\.js/]
  },

  /* No need for bundle size warnings */
  performance: { hints: false }
};
