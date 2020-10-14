const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { merge } = require('webpack-merge');
const WebpackShellPlugin = require('webpack-shell-plugin');

const baseConfig = require('./base.config.js');
const { htmlMetaTags, projectRoot, useAppConfiguration } = require('./helpers');

const htmlWebPackPluginConfiguration = {
  meta: htmlMetaTags,
  template: path.resolve(projectRoot, 'index.html'),
  title: 'Skybrush Live',
};

const plugins = [
  // Create index.html on-the-fly
  new HtmlWebpackPlugin(htmlWebPackPluginConfiguration),
];

/* In dev mode, also run Electron and let it load the live bundle */
if (process.env.NODE_ENV !== 'production' && process.env.DEPLOYMENT !== '1') {
  plugins.push(
    new WebpackShellPlugin({
      onBuildEnd: ['electron launcher.js'],
      dev: true,
    })
  );
}

/* Override the configuration module based on the environment variables if needed */
const variantConfig = process.env.SKYBRUSH_VARIANT
  ? useAppConfiguration(process.env.SKYBRUSH_VARIANT)
  : {};

module.exports = merge(baseConfig, {
  entry: {
    app: ['@babel/polyfill', './src/index'],
  },
  plugins,
  ...variantConfig,
});
