const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');

const baseConfig = require('./base.config.js');
const { htmlMetaTags, projectRoot, useAppConfiguration } = require('./helpers');

const htmlWebPackPluginConfiguration = {
  meta: htmlMetaTags,
  template: path.resolve(projectRoot, 'index.html'),
  title: 'Skybrush Live',
};

const plugins = [
  // process and Buffer polyfills are needed for AFrame to work nicely as of
  // 1.1.0
  new webpack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
    process: 'process/browser',
  }),

  // Create index.html on-the-fly
  new HtmlWebpackPlugin(htmlWebPackPluginConfiguration),
];

/* In dev mode, also run Electron and let it load the live bundle */
if (process.env.NODE_ENV !== 'production' && process.env.DEPLOYMENT !== '1') {
  plugins.push(
    new WebpackShellPluginNext({
      onBuildEnd: {
        scripts: ['electron launcher.js'],
        blocking: false,
        dev: true,
        parallel: true,
      },
    })
  );
}

/* Override the configuration module based on the environment variables if needed */
const variantConfig = process.env.SKYBRUSH_VARIANT
  ? useAppConfiguration(process.env.SKYBRUSH_VARIANT)
  : {};

module.exports = merge(baseConfig, {
  entry: {
    app: ['process/browser', './src/index'],
  },
  plugins,
  ...variantConfig,
});
