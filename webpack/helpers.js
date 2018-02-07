var path = require('path')
var projectRoot = path.resolve(__dirname, '..')
var mockRoot = path.resolve(projectRoot, 'src', 'mocks')
var nativeNodeReexportRoot = path.resolve(projectRoot, 'src', 'utils', 'reexport')

module.exports = {
  mock: (name) => path.resolve(mockRoot, name),
  nodeNative: (name) => path.resolve(nativeNodeReexportRoot, name),
  projectRoot: projectRoot
}
