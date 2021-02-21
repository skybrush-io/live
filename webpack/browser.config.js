// Webpack configuration for the output that is directly usable on
// https://live.skybrush.io

const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');

const baseConfig = require('./base.config.js');
const { htmlMetaTags, projectRoot } = require('./helpers');

module.exports = merge(baseConfig, {
  entry: {
    polyfill: ['@babel/polyfill', 'whatwg-fetch'],
    app: './src/index',
  },

  plugins: [
    // process and Buffer polyfills are needed for AFrame to work nicely as of
    // 1.1.0
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }), 

    // Create index.html on-the-fly
    new HtmlWebpackPlugin({
      favicon: path.resolve(projectRoot, 'assets', 'icons', 'favicon.ico'),
      meta: htmlMetaTags,
      template: path.resolve(projectRoot, 'index.html'),
      title:
        'Skybrush Live | The Next-generation Drone Light Show Software Suite',
    }),
  ],
});
