const { merge } = require('webpack-merge');
const baseConfig = require('./base.config.js');

const plugins = [
  new webpack.DefinePlugin({
    // need to handle import.meta.url before Webpack does. Webpack would leak
    // the name of the compilation folder and we don't want that, but we can't
    // leave import.meta.url in the file as-is because Electron would choke
    // on it.
    'import.meta.url': '"file:///"',
  }),
];

module.exports = merge(baseConfig, {
  entry: './launcher.mjs',
  output: {
    filename: 'launcher.bundle.js',
  },

  /* prevent evaluation of __dirname and __filename at build time in
   * launcher and preloader */
  node: {
    __dirname: false,
    __filename: false,
  },

  plugins,

  target: 'electron-main',
});
