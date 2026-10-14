import Box from '@mui/material/Box';
import type { SxProps } from '@mui/material/styles';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { type FocusEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UAVSelector } from '~/components/uavs/UAVSelector';
import type { MissionIndex } from '~/model/missions';
import type { Identifier } from '~/utils/collections';
import { formatMissionId } from '~/utils/formatting';

import { FIELD_COLORS } from './constants';
import type { SwapFieldSide } from './types';

/**
 * Returns whether the user is typing a show ID (`sN`) into a drone field.
 */
const isSwapShowIdFilter = (filter: string): boolean =>
  filter.trim().toLowerCase().startsWith('s');

/**
 * Returns the text to put into a drone field when an item is selected from the
 * UAV selector: the show ID (slot reference) if the user was typing a show ID,
 * the UAV ID (drone reference) otherwise.
 */
const getLabelForSelection = (
  item: { missionIndex?: MissionIndex; uavId?: Identifier },
  filter: string
): string => {
  if (isSwapShowIdFilter(filter) && item.missionIndex !== undefined) {
    return formatMissionId(item.missionIndex);
  }

  return item.uavId ?? '';
};

const createFieldStyle = (color: string) => ({
  '& .MuiFilledInput-root': {
    // large enough to ensure that the dialog does not grow when the user swaps two
    // drones with 5-digit IDs
    minWidth: 240,
    '&::before': {
      borderBottom: '3px solid',
      borderBottomColor: color,
    },
    '&::after': {
      borderBottom: '3px solid',
      borderBottomColor: color,
    },
    '&:hover:not(.Mui-disabled)::before': {
      borderBottom: '3px solid',
      borderBottomColor: color,
    },
    '&.Mui-focused::after': {
      borderBottom: '3px solid',
      borderBottomColor: color,
    },
  },
});

const FIELD_STYLES: Record<SwapFieldSide, SxProps> = {
  left: createFieldStyle(FIELD_COLORS['left']),
  right: createFieldStyle(FIELD_COLORS['right']),
};

type SwapDroneFieldProps = Omit<TextFieldProps, 'onChange' | 'value'> & {
  onChange: (text: string) => void;
  side: SwapFieldSide;
  value: string;
};

/**
 * Text field for entering a drone reference (UAV ID or show ID), with a UAV
 * selector popup that filters on the entered text. The popup stays open while
 * the focus remains within the field or the popup.
 */
const SwapDroneField = ({
  onChange,
  side,
  value,
  ...rest
}: SwapDroneFieldProps) => {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleBlur = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (next && rootRef.current?.contains(next)) {
      return;
    }

    handleClose();
  };

  return (
    <Box ref={rootRef} onBlur={handleBlur}>
      <TextField
        inputRef={inputRef}
        label={t('swapDronesDialog.fieldLabel')}
        variant='filled'
        value={value}
        sx={FIELD_STYLES[side]}
        onFocus={(event) => {
          setAnchorEl(event.currentTarget);
        }}
        onChange={(event) => {
          setAnchorEl(event.currentTarget);
          onChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleClose();
          }
        }}
        {...rest}
      />
      <UAVSelector
        retainFocus
        anchorEl={anchorEl}
        filter={value}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onSelect={({ uavId, missionIndex }) => {
          if (!uavId) {
            return;
          }

          onChange(getLabelForSelection({ uavId, missionIndex }, value));
          inputRef.current?.blur();
        }}
      />
    </Box>
  );
};

export default SwapDroneField;
