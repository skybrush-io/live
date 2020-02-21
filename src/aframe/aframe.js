/**
 * Requiring all modules that we need in order to make AFrame work.
 */

// Do not use require('aframe') -- it would load the compiled AFrame bundle,
// which prevents us from using our custom  fork for layout-bmfont-text that
// prevents an issue with Content-Security-Policy
const AFrame = require('aframe/src/index');

export default AFrame;
