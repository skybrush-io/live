import Chip, { type ChipProps } from '@mui/material/Chip';
import type { SxProps } from '@mui/material/styles';

import { monospacedFont } from '@skybrush/app-theme-mui';

import { FIELD_COLORS } from './constants';
import type { SwapFieldSide } from './utils';

const COMMON_STYLES: SxProps = {
  height: 20,
  fontFamily: monospacedFont,
  fontWeight: 600,
};

const STYLES: Record<SwapFieldSide | 'empty', SxProps> = {
  empty: COMMON_STYLES,
  left: {
    ...COMMON_STYLES,
    bgcolor: FIELD_COLORS['left'],
    color: 'warning.contrastText',
  },
  right: {
    ...COMMON_STYLES,
    bgcolor: FIELD_COLORS['right'],
    color: 'success.contrastText',
  },
};

type SwapDroneBadgeProps = {
  side?: SwapFieldSide;
} & ChipProps;

const SwapDroneBadge = ({ side, ...rest }: SwapDroneBadgeProps) => (
  <Chip size='small' sx={STYLES[side ?? 'empty']} {...rest} />
);

export default SwapDroneBadge;
