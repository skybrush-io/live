import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import { useTheme } from '@material-ui/core/styles';

import Header from '~/components/dialogs/FormHeader';
import { updateAppSettings } from '~/features/settings/slice';
import {
  getDesiredPlacementAccuracyInMeters,
  getDesiredTakeoffHeadingAccuracy,
} from '~/features/settings/selectors';

const AngleField = ({ max, min, size, step, ...rest }) => (
  <TextField
    InputProps={{
      endAdornment: <InputAdornment position='end'>degrees</InputAdornment>,
    }}
    inputProps={{ max, min, size, step, type: 'number' }}
    variant='filled'
    {...rest}
  />
);

AngleField.propTypes = {
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.number,
};

const DistanceField = ({ max, min, size, step, ...rest }) => (
  <TextField
    InputProps={{
      endAdornment: <InputAdornment position='end'>m</InputAdornment>,
    }}
    inputProps={{ max, min, size, step, type: 'number' }}
    variant='filled'
    {...rest}
  />
);

DistanceField.propTypes = {
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.number,
};

const DurationField = ({ max, min, size, ...rest }) => (
  <TextField
    InputProps={{
      endAdornment: <InputAdornment position='end'>seconds</InputAdornment>,
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
  value: PropTypes.number,
};

DurationField.defaultProps = {
  size: 4,
};

const UAVsTabPresentation = ({
  autoRemove,
  forgetThreshold,
  goneThreshold,
  onCheckboxToggled,
  onDistanceFieldUpdated,
  onIntegerFieldUpdated,
  placementAccuracy,
  takeoffHeadingAccuracy,
  warnThreshold,
}) => {
  const theme = useTheme();
  return (
    <>
      <FormGroup style={{ marginBottom: theme.spacing(2) }}>
        <FormControl style={{ alignItems: 'center', flexDirection: 'row' }}>
          <FormControlLabel
            label='Warn about drones not seen for at least'
            control={<Checkbox checked style={{ visibility: 'hidden' }} />}
          />
          <DurationField
            name='warnThreshold'
            min={1}
            max={3600}
            value={warnThreshold}
            onChange={onIntegerFieldUpdated}
          />
        </FormControl>

        <FormControl style={{ alignItems: 'center', flexDirection: 'row' }}>
          <FormControlLabel
            label='Mark drones as gone after'
            control={<Checkbox checked style={{ visibility: 'hidden' }} />}
          />
          <DurationField
            name='goneThreshold'
            min={1}
            max={3600}
            value={goneThreshold}
            onChange={onIntegerFieldUpdated}
          />
        </FormControl>

        <FormControl style={{ alignItems: 'center', flexDirection: 'row' }}>
          <FormControlLabel
            label='Forget unseen drones after'
            control={
              <Checkbox
                checked={Boolean(autoRemove)}
                name='autoRemove'
                onChange={onCheckboxToggled}
              />
            }
          />
          <DurationField
            name='forgetThreshold'
            min={1}
            max={3600}
            value={forgetThreshold}
            disabled={!autoRemove}
            onChange={onIntegerFieldUpdated}
          />
        </FormControl>
      </FormGroup>
      <Divider />

      <Box my={2}>
        <Header>Mission setup</Header>

        <Box display='flex' flexDirection='row' mb={1}>
          <DistanceField
            fullWidth
            name='placementAccuracy'
            label='Desired placement accuracy'
            min={0.5}
            max={20}
            step={0.5}
            value={placementAccuracy}
            onChange={onDistanceFieldUpdated}
          />
          <Box width={theme.spacing(2)} />
          <AngleField
            fullWidth
            name='takeoffHeadingAccuracy'
            label='Desired heading accuracy'
            min={1}
            max={45}
            step={1}
            value={takeoffHeadingAccuracy}
            onChange={onIntegerFieldUpdated}
          />
        </Box>

        <Typography variant='body2' color='textSecondary'>
          Used before multi-drone missions to check whether each drone is at its
          prescribed takeoff position and is facing the right direction.
        </Typography>
      </Box>
    </>
  );
};

UAVsTabPresentation.propTypes = {
  autoRemove: PropTypes.bool,
  forgetThreshold: PropTypes.number,
  goneThreshold: PropTypes.number,
  onCheckboxToggled: PropTypes.func,
  onDistanceFieldUpdated: PropTypes.func,
  onIntegerFieldUpdated: PropTypes.func,
  placementAccuracy: PropTypes.number,
  takeoffHeadingAccuracy: PropTypes.number,
  warnThreshold: PropTypes.number,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.settings.uavs,
    placementAccuracy: getDesiredPlacementAccuracyInMeters(state),
    takeoffHeadingAccuracy: getDesiredTakeoffHeadingAccuracy(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCheckboxToggled(event) {
      dispatch(
        updateAppSettings('uavs', {
          [event.target.name]: event.target.checked,
        })
      );
    },

    onDistanceFieldUpdated(event) {
      // We store millimeters in the Redux store to avoid rounding errors
      const distance = Math.round(Number.parseFloat(event.target.value) * 1000);

      if (distance > 0) {
        dispatch(
          updateAppSettings('uavs', {
            [event.target.name]: distance,
          })
        );
      }
    },

    onIntegerFieldUpdated(event) {
      const value = Number.parseInt(event.target.value, 10);

      if (value > 0) {
        dispatch(
          updateAppSettings('uavs', {
            [event.target.name]: value,
          })
        );
      }
    },
  })
)(UAVsTabPresentation);
