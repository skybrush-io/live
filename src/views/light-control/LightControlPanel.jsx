import React from 'react';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';

import LightControlGrid from './LightControlGrid';
import LightControlMainSwitch from './LightControlMainSwitch';

/**
 * Panel that shows the widgets that are needed to control the LED lights on
 * the drone swarm from the GCS before or during a drone show.
 */
const LightControlPanel = () => (
  <Box
    display='flex'
    flexDirection='column'
    height='100%'
    id='tour-light-control'
    overflow='hidden'
  >
    <List dense>
      <LightControlMainSwitch />
    </List>
    <Divider />
    <LightControlGrid />
  </Box>
);

export default LightControlPanel;
