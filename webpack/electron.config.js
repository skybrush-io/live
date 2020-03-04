const merge = require('webpack-merge');
const WebpackShellPlugin = require('webpack-shell-plugin');
const baseConfig = require('./base.config.js');

const plugins = [];

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
  entry: ['./src/index'],
  output: {
    filename: 'bundle.js'
  },

  plugins
});
