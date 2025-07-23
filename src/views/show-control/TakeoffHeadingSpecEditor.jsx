import Explore from '@mui/icons-material/Explore';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Translation } from 'react-i18next';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import RotationField from '~/components/RotationField';
import {
  DEFAULT_TAKEOFF_HEADING,
  TakeoffHeadingMode,
} from '~/features/show/constants';

export const TakeoffHeadingSpecEditor = ({
  takeoffHeading,
  onChange,
  onSetToAverageHeading,
}) => {
  const { type = TakeoffHeadingMode.NONE, value = '0' } =
    takeoffHeading || DEFAULT_TAKEOFF_HEADING;

  const onTypeChanged = useCallback(
    (event) => {
      const type = event.target.value;
      if (onChange) {
        onChange({ ...takeoffHeading, type });
      }
    },
    [onChange, takeoffHeading]
  );

  const onValueChanged = useCallback(
    (value) => {
      if (onChange) {
        onChange({ ...takeoffHeading, value: String(value) });
      }
    },
    [onChange, takeoffHeading]
  );

  return (
    <Translation>
      {(t) => (
        <Box display='flex' flexDirection='row'>
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
          <Box p={1} />
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
            <Box alignSelf='bottom' pt={1}>
              <Tooltip
                content={t('takeoffHeadingSpecEditor.setToAvergaeHeading')}
              >
                <IconButton
                  edge='end'
                  size='large'
                  onClick={onSetToAverageHeading}
                >
                  <Explore />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      )}
    </Translation>
  );
};

TakeoffHeadingSpecEditor.propTypes = {
  takeoffHeading: PropTypes.shape({
    mode: PropTypes.oneOf(Object.values(TakeoffHeadingMode)),
    value: PropTypes.string.isRequired,
  }),
  onChange: PropTypes.func,
  onSetToAverageHeading: PropTypes.func,
};
