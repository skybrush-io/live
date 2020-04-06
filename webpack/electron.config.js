const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');
const WebpackShellPlugin = require('webpack-shell-plugin');

const baseConfig = require('./base.config.js');
const { projectRoot } = require('./helpers');

const plugins = [
  // Create index.html on-the-fly
  new HtmlWebpackPlugin({
    template: path.resolve(projectRoot, 'index.html'),
    title: 'Skybrush Live'
  })
];

/* In dev mode, also run Electron and let it load the live bundle */
if (process.env.NODE_ENV !== 'production' && process.env.DEPLOYMENT !== '1') {
  plugins.push(
    new WebpackShellPlugin({
      onBuildEnd: ['electron launcher.js'],
      dev: true
    })
  );
}

module.exports = merge.smart(baseConfig, {
  // @babel/polyfill not eneded here, it is loaded by the preloader script
  entry: {
    polyfill: '@babel/polyfill',
    app: './src/index'
  },
  plugins
});
