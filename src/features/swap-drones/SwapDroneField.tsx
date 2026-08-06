import Box from '@mui/material/Box';
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

import type { SlotState } from './types';
import { resolveDrone, selectionLabel } from './utils';

type SwapDroneFieldProps = {
  onSlotChange: (slot: SlotState) => void;
  slot: SlotState;
};

const SwapDroneField = ({ onSlotChange, slot }: SwapDroneFieldProps) => {
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
    resolveDrone(query, onlineUavIds, missionMapping, reverseMissionMapping);

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
    <Box ref={rootRef} sx={{ flex: 1 }} onBlur={handleBlur}>
      <TextField
        inputRef={inputRef}
        label={t('swapDronesDialog.fieldLabel')}
        size='small'
        variant='filled'
        value={slot.filterText}
        fullWidth
        slotProps={{ htmlInput: { maxLength: 32 } }}
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
            filterText: selectionLabel(
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
