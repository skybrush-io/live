import Chip from '@mui/material/Chip';

import { monospacedFont } from '@skybrush/app-theme-mui';

import { FIELD_COLORS } from './constants';
import type { SwapFieldSide, SwapPreviewBadgeColor } from './utils';

const BADGE_COLORS: Record<
  SwapPreviewBadgeColor,
  { bgcolor: string; color: string }
> = {
  left: {
    bgcolor: FIELD_COLORS['left'],
    color: 'warning.contrastText',
  },
  right: {
    bgcolor: FIELD_COLORS['right'],
    color: 'success.contrastText',
  },
};

type SwapDroneBadgeProps = {
  label: string;
  side?: SwapFieldSide;
};

const SwapDroneBadge = ({ label, side }: SwapDroneBadgeProps) => (
  <Chip
    label={label}
    size='small'
    component='span'
    sx={{
      height: 20,
      flexShrink: 0,
      mx: side ? 0 : 0.25,
      verticalAlign: 'middle',
      fontFamily: monospacedFont,
      fontWeight: 600,
      ...(side ? BADGE_COLORS[side] : {}),
      '& .MuiChip-label': { px: 0.75, py: 0 },
    }}
  />
);

export default SwapDroneBadge;
