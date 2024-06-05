const path = require('path');
const process = require('process');

const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.resolve(projectRoot, 'build');

const isDevelopment = process.env.NODE_ENV !== 'production';
const useHotModuleReloading = isDevelopment && process.env.DEPLOYMENT !== '1';

const htmlMetaTags = {
  charset: 'utf-8',
  description:
    'Skybrush Live: The Next-generation Drone Light Show Software Suite',
  viewport:
    'initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no',

  'Content-Security-Policy':
    "script-src 'self' https://dev.virtualearth.net; connect-src * ws: wss:;",
  'X-UA-Compatible': 'IE=edge',
};

const useAppConfiguration = (name = 'default') => ({
  resolve: {
    alias: {
      'config-overrides': path.resolve(projectRoot, 'config', name),
    },
  },
});

module.exports = {
  htmlMetaTags,
  isDevelopment,
  projectRoot,
  outputDir,
  useAppConfiguration,
  useHotModuleReloading,
};
