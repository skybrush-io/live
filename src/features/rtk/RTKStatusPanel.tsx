import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { secondaryAreaStyle } from '@skybrush/app-theme-mui';

import RTKCorrectionSourceSelector from './RTKCorrectionSourceSelector';
import RTKSatelliteObservations from './RTKSatelliteObservations';
import RTKStatusMiniList from './RTKStatusMiniList';
import { useRTKStatusSubscription } from './subscription';

/**
 * Collapsible area at the bottom of the panel that shows the satellite signal
 * strength chart.
 */
const SignalStrengthSection = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  return (
    <Box
      sx={[
        secondaryAreaStyle({ inset: 'top' }),
        { flexDirection: 'column', flexShrink: 0 },
      ]}
    >
      <ButtonBase
        aria-expanded={expanded}
        sx={{ width: '100%', justifyContent: 'space-between', px: 1, py: 0.5 }}
        onClick={() => {
          setExpanded((value) => !value);
        }}
      >
        <Typography variant='body2' color='textSecondary'>
          {t('RTKStatusPanel.signalStrengths')}
        </Typography>
        {expanded ? (
          <ExpandMore fontSize='small' />
        ) : (
          <ExpandLess fontSize='small' />
        )}
      </ButtonBase>
      <Collapse unmountOnExit in={expanded}>
        <Box sx={{ px: 1, pb: 1 }}>
          <RTKSatelliteObservations />
        </Box>
      </Collapse>
    </Box>
  );
};

/**
 * Panel that is shown when the contents of the RTK status header widget are
 * pinned to the workbench. Extends the contents of the tooltip with the RTK
 * source selector and the satellite signal strength chart.
 */
const RTKStatusPanel = () => {
  useRTKStatusSubscription();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 1 }}>
        <RTKCorrectionSourceSelector showPresetButtons={false} size='small' />
      </Box>
      {/* Horizontal padding matches the padding of tooltips. Mini list
          dividers extend into it with negative margins. */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', px: 1 }}>
        <RTKStatusMiniList />
      </Box>
      <SignalStrengthSection />
    </Box>
  );
};

export default RTKStatusPanel;
