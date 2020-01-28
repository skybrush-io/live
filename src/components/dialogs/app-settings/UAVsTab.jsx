import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import { useTheme } from '@material-ui/core/styles';

import { updateAppSettings } from '~/features/settings/slice';

const DurationField = ({ max, min, size, ...rest }) => (
  <TextField
    InputProps={{
      endAdornment: <InputAdornment position="end">seconds</InputAdornment>
    }}
    inputProps={{ max, min, size, type: 'number' }}
    {...rest}
  />
);

DurationField.propTypes = {
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.number,
  value: PropTypes.number
};

DurationField.defaultProps = {
  size: 4
};

const UAVsTabPresentation = ({
  autoRemove,
  forgetThreshold,
  goneThreshold,
  onCheckboxToggled,
  onDurationFieldUpdated,
  warnThreshold
}) => {
  const theme = useTheme();
  return (
    <FormGroup style={{ marginBottom: theme.spacing(2) }}>
      <FormControl style={{ alignItems: 'center', flexDirection: 'row' }}>
        <FormControlLabel
          label="Warn about drones not seen for at least"
          control={<Checkbox checked style={{ visibility: 'hidden' }} />}
        />
        <DurationField
          name="warnThreshold"
          min={1}
          max={3600}
          value={warnThreshold}
          disabled={!autoRemove}
          onChange={onDurationFieldUpdated}
        />
      </FormControl>

      <FormControl style={{ alignItems: 'center', flexDirection: 'row' }}>
        <FormControlLabel
          label="Mark drones as gone after"
          control={<Checkbox checked style={{ visibility: 'hidden' }} />}
        />
        <DurationField
          name="goneThreshold"
          min={1}
          max={3600}
          value={goneThreshold}
          disabled={!autoRemove}
          onChange={onDurationFieldUpdated}
        />
      </FormControl>

      <FormControl style={{ alignItems: 'center', flexDirection: 'row' }}>
        <FormControlLabel
          label="Forget unseen drones after"
          control={
            <Checkbox
              checked={Boolean(autoRemove)}
              name="autoRemove"
              onChange={onCheckboxToggled}
            />
          }
        />
        <DurationField
          name="forgetThreshold"
          min={1}
          max={3600}
          value={forgetThreshold}
          disabled={!autoRemove}
          onChange={onDurationFieldUpdated}
        />
      </FormControl>
    </FormGroup>
  );
};

UAVsTabPresentation.propTypes = {
  autoRemove: PropTypes.bool,
  forgetThreshold: PropTypes.number,
  goneThreshold: PropTypes.number,
  onCheckboxToggled: PropTypes.func,
  onDurationFieldUpdated: PropTypes.func,
  warnThreshold: PropTypes.number
};

export default connect(
  // mapStateToProps
  state => ({
    ...state.settings.uavs
  }),
  // mapDispatchToProps
  dispatch => ({
    onCheckboxToggled(event) {
      dispatch(
        updateAppSettings('uavs', {
          [event.target.name]: event.target.checked
        })
      );
    },

    onDurationFieldUpdated(event) {
      const duration = Number.parseInt(event.target.value, 10);

      if (duration > 0) {
        dispatch(
          updateAppSettings('uavs', {
            [event.target.name]: duration
          })
        );
      }
    }
  })
)(UAVsTabPresentation);
