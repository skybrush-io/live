import Box from '@mui/material/Box';
import type { SxProps } from '@mui/material/styles';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UAVSelector } from '~/components/uavs/UAVSelector';

import { FIELD_COLORS } from './constants';
import { swapSelectionLabel, type SwapFieldSide } from './utils';

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

type SwapDroneFieldProps = Omit<TextFieldProps, 'onChange' | 'value'> & {
  onChange: (text: string) => void;
  side: SwapFieldSide;
  value: string;
};

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

  const handleBlur = (event: React.FocusEvent) => {
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
          onChange(event.target.value);
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

          onChange(swapSelectionLabel({ uavId, missionIndex }, value));
          inputRef.current?.blur();
        }}
      />
    </Box>
  );
};

export default SwapDroneField;
