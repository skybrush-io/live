import AFrame from '@skybrush/aframe-components';

import '@skybrush/aframe-components/advanced-camera-controls';
import '@skybrush/aframe-components/meshline';

import 'aframe-environment-component';

import './components/deallocate';
import './components/drone-flock';
import './components/glow-material';
import './components/sync-pose-with-store';

import './primitives/drone-flock';

// eslint-disable-next-line unicorn/prefer-export-from
export default AFrame;
