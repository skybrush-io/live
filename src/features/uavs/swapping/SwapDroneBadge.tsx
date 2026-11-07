import Chip, { type ChipProps } from '@mui/material/Chip';
import type { SxProps } from '@mui/material/styles';
import mapValues from 'lodash-es/mapValues';

import { monospacedFont } from '@skybrush/app-theme-mui';

import { FIELD_COLORS } from './constants';
import type { SwapFieldSide } from './types';

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

/** Styles of badges of drones that are not online: same as above, dimmed */
const OFFLINE_STYLES: Record<SwapFieldSide | 'empty', SxProps> = mapValues(
  STYLES,
  (style) => ({ ...style, opacity: 0.5 })
);

type SwapDroneBadgeProps = {
  offline?: boolean;
  side?: SwapFieldSide;
} & ChipProps;

/**
 * Small monospaced chip showing a drone or a slot, colored according to the
 * field of the drone it refers to. Drones that are not online are dimmed.
 */
const SwapDroneBadge = ({ offline, side, ...rest }: SwapDroneBadgeProps) => (
  <Chip
    size='small'
    sx={(offline ? OFFLINE_STYLES : STYLES)[side ?? 'empty']}
    {...rest}
  />
);

export default SwapDroneBadge;
