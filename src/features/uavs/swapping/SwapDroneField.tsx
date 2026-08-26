import Box from '@mui/material/Box';
import type { SxProps } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';

import { UAVSelector } from '~/components/uavs/UAVSelector';
import {
  getMissionMapping,
  getReverseMissionMapping,
} from '~/features/mission/selectors';
import { getUAVIdList } from '~/features/uavs/selectors';

import { FIELD_COLORS } from './constants';
import type { ResolvedDrone } from './types';
import {
  resolveSwapDrone,
  swapSelectionLabel,
  type SwapFieldSide,
} from './utils';

/**
 * Object representing the text entered in a `SwapDroneField` and the drone that it
 * resolves to, if any.
 */
export type SwapDroneFieldValue = {
  filterText: string;
  resolved: ResolvedDrone | null;
};

const createFieldStyle = (color: string) => ({
  '& .MuiFilledInput-root': {
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

type SwapDroneFieldProps = {
  onSlotChange: (slot: SwapDroneFieldValue) => void;
  side: SwapFieldSide;
  slot: SwapDroneFieldValue;
};

const SwapDroneField = ({ onSlotChange, side, slot }: SwapDroneFieldProps) => {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ignoreBlurCommitRef = useRef(false);
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);

  const onlineUavIds = useSelector(getUAVIdList, { equalityFn: shallowEqual });
  const missionMapping = useSelector(getMissionMapping, {
    equalityFn: shallowEqual,
  });
  const reverseMissionMapping = useSelector(getReverseMissionMapping);

  const resolve = (query: string) =>
    resolveSwapDrone(
      query,
      onlineUavIds,
      missionMapping,
      reverseMissionMapping
    );

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleBlur = (event: React.FocusEvent) => {
    const next = event.relatedTarget;
    if (next && rootRef.current?.contains(next)) {
      return;
    }

    handleClose();

    if (ignoreBlurCommitRef.current) {
      ignoreBlurCommitRef.current = false;
      return;
    }

    const resolved = resolve(slot.filterText);
    onSlotChange({
      ...slot,
      resolved,
    });
  };

  return (
    <Box ref={rootRef} onBlur={handleBlur}>
      <TextField
        inputRef={inputRef}
        label={t('swapDronesDialog.fieldLabel')}
        variant='filled'
        value={slot.filterText}
        sx={FIELD_STYLES[side]}
        onFocus={(event) => {
          setAnchorEl(event.currentTarget);
        }}
        onChange={(event) => {
          const filterText = event.target.value;
          onSlotChange({
            filterText,
            resolved: resolve(filterText),
          });
        }}
      />
      <UAVSelector
        retainFocus
        anchorEl={anchorEl}
        filter={slot.filterText}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onSelect={({ uavId, missionIndex }) => {
          if (!uavId) {
            return;
          }

          onSlotChange({
            filterText: swapSelectionLabel(
              { uavId, missionIndex },
              slot.filterText
            ),
            resolved: {
              uavId,
              missionIndex: missionIndex ?? null,
            },
          });
          ignoreBlurCommitRef.current = true;
          inputRef.current?.blur();
        }}
      />
    </Box>
  );
};

export default SwapDroneField;
