// Webpack configuration for the output that is directly usable on
// https://live.skybrush.io

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const merge = require('webpack-merge');

const baseConfig = require('./base.config.js');
const { projectRoot } = require('./helpers');

module.exports = merge.smart(baseConfig, {
  entry: {
    polyfill: '@babel/polyfill',
    app: './src/index'
  },

  plugins: [
    // Clean build folder before building
    new CleanWebpackPlugin(),

    // Create index.html on-the-fly
    new HtmlWebpackPlugin({
      template: path.resolve(projectRoot, 'index.html'),
      title:
        'Skybrush Live | The Next-generation Drone Light Show Software Suite'
    })
  ]
});
