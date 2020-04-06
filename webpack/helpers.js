const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.resolve(projectRoot, 'build');

module.exports = {
  projectRoot,
  outputDir
};
