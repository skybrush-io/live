// Webpack configuration for the output that is directly usable on
// https://live.skybrush.io

const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { merge } = require('webpack-merge');

const baseConfig = require('./base.config.js');
const { htmlMetaTags, projectRoot } = require('./helpers');

module.exports = merge(baseConfig, {
  entry: {
    polyfill: ['@babel/polyfill', 'whatwg-fetch'],
    app: './src/index',
  },

  plugins: [
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
