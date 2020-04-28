// Webpack configuration for the output that is directly usable on
// https://live.skybrush.io

const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const merge = require('webpack-merge');

const baseConfig = require('./base.config.js');
const { htmlMetaTags: baseHtmlMetaTags, outputDir, projectRoot } = require('./helpers');

const htmlMetaTags = { ...baseHtmlMetaTags };

delete htmlMetaTags["Content-Security-Policy"];

module.exports = merge.smart(baseConfig, {
  entry: {
    polyfill: ['@babel/polyfill', 'whatwg-fetch'],
    app: './src/index',
  },

  output: {
    publicPath: '_/',
    path: path.resolve(outputDir, '_')
  },

  resolve: {
    alias: {
      config: path.resolve(projectRoot, 'config', 'webapp-demo'),
    },
  },

  plugins: [
    // Create index.html on-the-fly
    new HtmlWebpackPlugin({
      meta: htmlMetaTags,
      template: path.resolve(projectRoot, 'index.html'),
      filename: path.resolve(outputDir, 'index.html'),
      hash: true, /* for cache busting */
      title:
        'Skybrush Live | The Next-generation Drone Light Show Software Suite',
    }),
  ],
});
