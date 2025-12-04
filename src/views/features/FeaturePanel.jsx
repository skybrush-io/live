import Box from '@mui/material/Box';
import React from 'react';

import FeatureList from './FeatureList';
import FeaturePanelToolbar from './FeaturePanelToolbar';

/**
 * Panel that shows the widgets that are used to manage the features on the map.
 */
const FeaturePanel = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <FeatureList dense />
    </Box>
    <FeaturePanelToolbar />
  </Box>
);

export default FeaturePanel;
