import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';

import LightControlGrid from './LightControlGrid';
import LightControlMainSwitch from './LightControlMainSwitch';

/**
 * Panel that shows the widgets that are needed to control the LED lights on
 * the drone swarm from the GCS before or during a drone show.
 */
const LightControlPanel = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    }}
  >
    <List dense>
      <LightControlMainSwitch />
    </List>
    <Divider />
    <LightControlGrid />
  </Box>
);

export default LightControlPanel;
