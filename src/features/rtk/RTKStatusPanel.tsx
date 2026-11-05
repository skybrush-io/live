import Box from '@mui/material/Box';

import RTKSatelliteObservations from './RTKSatelliteObservations';
import RTKStatusMiniList from './RTKStatusMiniList';
import { useRTKStatusSubscription } from './subscription';

/**
 * Panel that is shown when the contents of the RTK status header widget are
 * pinned to the workbench. Extends the contents of the tooltip with the
 * satellite signal strength chart.
 */
const RTKStatusPanel = () => {
  useRTKStatusSubscription();

  return (
    <Box>
      <RTKStatusMiniList />
      <Box sx={{ px: 1, pb: 1 }}>
        <RTKSatelliteObservations />
      </Box>
    </Box>
  );
};

export default RTKStatusPanel;
