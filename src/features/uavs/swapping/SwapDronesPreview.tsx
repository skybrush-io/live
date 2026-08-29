import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Trans, useTranslation } from 'react-i18next';

import SwapDroneBadge from './SwapDroneBadge';
import { getSwapPreviewLineKey, type SwapPreviewLine } from './utils';

const PreviewLineCard = ({ line }: { line: SwapPreviewLine }) => {
  const badgeComponents = Object.fromEntries(
    Object.entries(line.badges).map(([name, badge]) => [
      name,
      <SwapDroneBadge key={name} label={badge.label} side={badge.color} />,
    ])
  );

  return (
    <Paper variant='outlined' sx={{ p: 1 }}>
      <Typography variant='body2' color='text.secondary'>
        <Trans
          i18nKey={line.i18nKey}
          components={{
            bold: <strong />,
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
