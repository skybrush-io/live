import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Detached show-control panel. Primary controls live in the bottom bar.
 */
const ShowControlPanel = () => {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        p: 2,
        textAlign: 'center',
      }}
    >
      <Typography color='textSecondary' variant='body2'>
        {t('bottomBar.detachedPanelHint')}
      </Typography>
    </Box>
  );
};

export default ShowControlPanel;
