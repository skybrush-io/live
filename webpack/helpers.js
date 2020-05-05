const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.resolve(projectRoot, 'build');

const htmlMetaTags = {
  "charset": "utf-8",
  "description": "Skybrush Live: The Next-generation Drone Light Show Software Suite",
  "viewport": "initial-scale=1.0,maximum-scale=1.0,minimum-scale=1.0,user-scalable=no",

  "Content-Security-Policy": "script-src 'self' https://dev.virtualearth.net; connect-src * ws: wss:;",
  "X-UA-Compatible": "IE=edge",
};

module.exports = {
  htmlMetaTags,
  projectRoot,
  outputDir,
};
