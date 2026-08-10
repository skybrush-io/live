import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import {
  swapFieldAccentColor,
  type SwapPreviewBadge,
  type SwapPreviewBadgeColor,
  type SwapPreviewLine,
  type SwapPreviewState,
} from './utils';

const BADGE_COLORS: Record<
  SwapPreviewBadgeColor,
  { bgcolor: string; color: string }
> = {
  left: {
    bgcolor: swapFieldAccentColor('left'),
    color: 'warning.contrastText',
  },
  right: {
    bgcolor: swapFieldAccentColor('right'),
    color: 'success.contrastText',
  },
};

const InlineBadge = ({ color, label }: SwapPreviewBadge) => (
  <Chip
    label={label}
    size='small'
    component='span'
    sx={{
      height: 20,
      mx: 0.25,
      verticalAlign: 'middle',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontWeight: 600,
      ...(color ? BADGE_COLORS[color] : {}),
      '& .MuiChip-label': { px: 0.75, py: 0 },
    }}
  />
);

const Bold = ({ children }: { children?: ReactNode }) => (
  <Box component='span' sx={{ fontWeight: 700, color: 'text.secondary' }}>
    {children}
  </Box>
);

const PreviewLineCard = ({ line }: { line: SwapPreviewLine }) => {
  const badgeComponents = Object.fromEntries(
    Object.entries(line.badges).map(([name, badge]) => [
      name,
      <InlineBadge key={name} {...badge} />,
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
  preview: Extract<SwapPreviewState, { kind: 'placeholder' | 'ready' }>;
};

const SwapDronesPreview = ({ preview }: SwapDronesPreviewProps) => {
  const { t } = useTranslation();

  if (preview.kind === 'placeholder') {
    return (
      <Typography variant='body2' color='text.secondary'>
        {preview.message}
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      <Typography variant='subtitle2' color='text.secondary'>
        {t('swapDronesDialog.preview.heading')}
      </Typography>
      <Stack spacing={1} sx={{ width: '100%' }}>
        {preview.lines.map((line, index) => (
          <PreviewLineCard key={index} line={line} />
        ))}
      </Stack>
    </Stack>
  );
};

export default SwapDronesPreview;
