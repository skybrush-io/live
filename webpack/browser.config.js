// Webpack configuration for dynamic bundling
// and serving to browsers during development

const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');
const { rspack } = require('@rspack/core');
const { merge } = require('webpack-merge');

const baseConfig = require('./base.config.js');
const {
  htmlMetaTags,
  projectRoot,
  useHotModuleReloading,
} = require('./helpers');

const optimization = {};
const plugins = [
  // process and Buffer polyfills are needed for AFrame to work nicely as of
  // 1.1.0
  new rspack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
    process: 'process/browser',
  }),

  // Create index.html on-the-fly
  new HtmlWebpackPlugin({
    favicon: path.resolve(projectRoot, 'assets', 'icons', 'favicon.ico'),
    meta: htmlMetaTags,
    template: path.resolve(projectRoot, 'index.html'),
    title:
      'Skybrush Live | The Next-generation Drone Light Show Software Suite',
  }),
];

if (useHotModuleReloading) {
  plugins.push(
    new ReactRefreshPlugin(),
    new rspack.HotModuleReplacementPlugin()
  );

  optimization.runtimeChunk = 'single'; // hot module reloading needs this
}

module.exports = merge(baseConfig, {
  entry: {
    app: './src/index',
  },
  optimization,
  plugins,
});
