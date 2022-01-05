// Use strict mode so we can have block-scoped declarations
'use strict';

const path = require('path');
const process = require('process');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

const { GitRevisionPlugin } = require('git-revision-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const { projectRoot } = require('./helpers');

const isDevelopment = process.env.NODE_ENV !== 'production';

const gitRevisionPlugin = new GitRevisionPlugin();

module.exports = {
  mode: 'development',

  output: {
    filename: '[name].bundle.js',
  },

  devtool: isDevelopment ? 'cheap-module-source-map' : undefined,

  devServer: {
    hot: true,
  },

  plugins: [
    // The next module is needed for golden-layout to work nicely
    new webpack.ProvidePlugin({
      ReactDOM: 'react-dom',
      React: 'react',
    }),

    // Resolve process.env in the code; the object below provides the default
    // values
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
      DEPLOYMENT: '0',
    }),

    // Resolve the git version number and commit hash in the code
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(gitRevisionPlugin.version()),
      COMMIT_HASH: JSON.stringify(gitRevisionPlugin.commithash()),
    }),

    // Add environment variables from .env
    new Dotenv({
      ignoreStub: true, // needed because electron-is-dev uses "ELECTRON_IS_DEV in process.env", which is broken if process.env is stubbed
    }),

    // Add VERSION and COMMITHASH file to output
    gitRevisionPlugin,

    // Enable hot reload support in dev mode
    isDevelopment && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),

  resolve: {
    alias: {
      '~': path.resolve(projectRoot, 'src'),
      config: path.resolve(projectRoot, 'config', 'default'),
      'layout-bmfont-text': '@collmot/layout-bmfont-text',
    },
    extensions: ['.webpack.js', '.web.js', '.mjs', '.js', '.jsx', '.json'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util'),
      vm: require.resolve('vm-browserify'),
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
      {
        test: /\.m?jsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: [
                isDevelopment && require.resolve('react-refresh/babel'),
              ].filter(Boolean),
            },
          },
        ],
        include: [
          path.join(projectRoot, 'config'),
          path.join(projectRoot, 'src'),
        ],
      },
      {
        test: /\.less$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' },
          { loader: 'less-loader' },
        ],
        include: path.join(projectRoot, 'assets', 'css'),
      },
      {
        test: /\.(png|jpg|skyc)$/,
        type: 'asset/resource',
        include: path.join(projectRoot, 'assets'),
      },
      {
        test: /\.(woff|woff2|eot|ttf|svg|mp3|wav|ogg)$/,
        type: 'asset/resource',
      },
    ],
    noParse: [/dist\/ol.*\.js/],
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        /* Extract license comments to a separate file */
        extractComments: /^@preserve|license|cc-/i,

        /* Drop console.log() calls in production */
        terserOptions: {
          compress: {
            // eslint-disable-next-line camelcase
            drop_console: true,
          },
          output: {
            // This is needed because otherwise Terser will happily replace
            // escape sequences in string literals with their Unicode
            // equivalents, which makes Electron blow up when starting the app,
            // at least on macOS. Electron will start reading the file as ASCII,
            // not UTF-8, and it will ultimately crash because lodash/deburr
            // contains fancy accented characters as keys in an object, and
            // the UTF-8 representations of these accented characters get parsed
            // as ASCII, leading to invalid JS code.
            //
            // eslint-disable-next-line camelcase
            ascii_only: true,
          },
        },
      }),
    ],
    runtimeChunk: 'single', // hot module reloading needs this
  },

  /* No need for bundle size warnings */
  performance: { hints: false },
};
