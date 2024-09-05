import React from 'react';

import Box from '@material-ui/core/Box';
import FeatureList from './FeatureList';
import FeaturePanelToolbar from './FeaturePanelToolbar';

/**
 * Panel that shows the widgets that are used to manage the features on the map.
 */
const FeaturePanel = () => (
  <Box display='flex' flexDirection='column' height='100%'>
    <Box height='100%' style={{ overflowY: 'auto' }}>
      <FeatureList dense />
    </Box>
    <FeaturePanelToolbar />
  </Box>
);

export default FeaturePanel;
