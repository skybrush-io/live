const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ReactRefreshRspackPlugin } = require('@rspack/plugin-react-refresh');
const { rspack } = require('@rspack/core');
const { merge } = require('webpack-merge');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');

const baseConfig = require('./base.config.js');
const {
  htmlMetaTags,
  projectRoot,
  useHotModuleReloading,
} = require('./helpers');

const htmlWebPackPluginConfiguration = {
  meta: htmlMetaTags,
  template: path.resolve(projectRoot, 'index.html'),
  title: 'Skybrush Live',
};

const optimization = {};
const plugins = [
  // process and Buffer polyfills are needed for AFrame to work nicely as of
  // 1.1.0
  new rspack.ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
    process: require.resolve('process/browser'),
  }),

  // Create index.html on-the-fly
  new HtmlWebpackPlugin(htmlWebPackPluginConfiguration),
];

/* In dev mode, also run Electron and let it load the live bundle */
if (useHotModuleReloading) {
  plugins.push(
    new WebpackShellPluginNext({
      onBuildEnd: {
        scripts: ['electron launcher.mjs'],
        blocking: false,
        dev: true,
        parallel: true,
      },
    }),

    // Enable hot reload support in dev mode
    new ReactRefreshRspackPlugin(),
    new rspack.HotModuleReplacementPlugin()
  );

  optimization.runtimeChunk = 'single'; // hot module reloading needs this
}

module.exports = merge(baseConfig, {
  devServer: {
    server: {
      type: 'https',
    },
  },
  entry: {
    app: ['process/browser', './src/index'],
  },
  optimization,
  plugins,
  resolve: {
    alias: {
      // These are needed for WorkerUrlPlugin to work correctly, but only in the
      // browser context
      child_process: false,
      worker_threads: false,
    },
  },
});
