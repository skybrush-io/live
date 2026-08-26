import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import SwapDroneBadge from './SwapDroneBadge';
import { getSwapPreviewLineKey, type SwapPreviewLine } from './utils';

const Bold = ({ children }: { children?: ReactNode }) => (
  <Box component='span' sx={{ fontWeight: 700, color: 'text.secondary' }}>
    {children}
  </Box>
);

const PreviewLineCard = ({ line }: { line: SwapPreviewLine }) => {
  const badgeComponents = Object.fromEntries(
    Object.entries(line.badges).map(([name, badge]) => [
      name,
      <SwapDroneBadge key={name} label={badge.label} side={badge.color} />,
    ])
  );

  return (
    <Paper
      variant='outlined'
      sx={{
        p: 1.25,
        width: '100%',
        bgcolor: 'grey.800',
        borderColor: 'divider',
      }}
    >
      <Typography
        variant='body2'
        color='text.secondary'
        component='div'
        sx={{ whiteSpace: 'nowrap' }}
      >
        <Trans
          i18nKey={line.i18nKey}
          components={{
            bold: <Bold />,
            ...badgeComponents,
          }}
        />
      </Typography>
    </Paper>
  );
};

type SwapDronesPreviewProps = {
  lines: SwapPreviewLine[];
};

const SwapDronesPreview = ({ lines }: SwapDronesPreviewProps) => {
  const { t } = useTranslation();

  return (
    <Stack spacing={1}>
      <Typography variant='subtitle2' color='text.secondary'>
        {t('swapDronesDialog.preview.heading')}
      </Typography>
      <Stack spacing={1} sx={{ width: '100%' }}>
        {lines.map((line) => (
          <PreviewLineCard key={getSwapPreviewLineKey(line)} line={line} />
        ))}
      </Stack>
    </Stack>
  );
};

export default SwapDronesPreview;
