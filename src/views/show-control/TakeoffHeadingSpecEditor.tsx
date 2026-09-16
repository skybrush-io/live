import NearMe from '@mui/icons-material/NearMe';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import Select from '@mui/material/Select';
import { useCallback } from 'react';
import { Translation } from 'react-i18next';

import { Tooltip } from '@skybrush/mui-components';

import RotationField from '~/components/RotationField';
import {
  DEFAULT_TAKEOFF_HEADING,
  TakeoffHeadingMode,
  type TakeoffHeadingSpecification,
} from '~/features/show/constants';

type Props = {
  takeoffHeading?: TakeoffHeadingSpecification;
  onChange?: (value: TakeoffHeadingSpecification) => void;
  onSetToAverageHeading?: () => void;
};

export const TakeoffHeadingSpecEditor = ({
  takeoffHeading = DEFAULT_TAKEOFF_HEADING,
  onChange,
  onSetToAverageHeading,
}: Props) => {
  const { type = TakeoffHeadingMode.NONE, value = '0' } = takeoffHeading;

  const onTypeChanged = useCallback(
    (event: SelectChangeEvent<TakeoffHeadingMode>) => {
      const type = event.target.value;
      if (onChange) {
        onChange({ ...takeoffHeading, type });
      }
    },
    [onChange, takeoffHeading]
  );

  const onValueChanged = useCallback(
    (value: number) => {
      if (onChange) {
        onChange({
          ...takeoffHeading,
          value: String(value),
        });
      }
    },
    [onChange, takeoffHeading]
  );

  return (
    <Translation>
      {(t) => (
        <Box sx={{ display: 'flex', flexDirection: 'row' }}>
          <FormControl fullWidth variant='filled'>
            <InputLabel htmlFor='takeoff-heading-type'>
              {t('takeoffHeadingSpecEditor.UAVheadings')}
            </InputLabel>
            <Select
              value={type}
              inputProps={{ id: 'takeoff-heading-type' }}
              onChange={onTypeChanged}
            >
              <MenuItem value={TakeoffHeadingMode.NONE}>
                {t('takeoffHeadingSpecEditor.unspecified')}
              </MenuItem>
              <MenuItem value={TakeoffHeadingMode.ABSOLUTE}>
                {t(
                  'takeoffHeadingSpecEditor.specifiedByAbsoluteCompassDirection'
                )}
              </MenuItem>
              <MenuItem value={TakeoffHeadingMode.RELATIVE}>
                {t(
                  'takeoffHeadingSpecEditor.specifiedRelativeToShowOrientation'
                )}
              </MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ p: 1 }} />
          <RotationField
            disabled={type === TakeoffHeadingMode.NONE}
            style={{ minWidth: 160 }}
            label={
              type === TakeoffHeadingMode.ABSOLUTE
                ? t('takeoffHeadingSpecEditor.compassDirection')
                : t('takeoffHeadingSpecEditor.headingOffset')
            }
            value={value}
            variant='filled'
            onChange={onValueChanged}
          />
          {onSetToAverageHeading && (
            <Box sx={{ alignSelf: 'bottom', pt: 1 }}>
              <Tooltip
                content={t('takeoffHeadingSpecEditor.setToAverageHeading')}
              >
                <IconButton
                  edge='end'
                  size='large'
                  onClick={onSetToAverageHeading}
                >
                  <NearMe />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      )}
    </Translation>
  );
};
