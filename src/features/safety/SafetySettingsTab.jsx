/**
 * @file Tab that shows the safety settings and allows the user to edit them.
 */

import mapValues from 'lodash-es/mapValues';
import { TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputAdornment from '@material-ui/core/InputAdornment';

import {
  createValidator,
  isEmpty,
  optional,
  positive,
} from '~/utils/validation';

import { getSafetySettings } from './selectors';
import { updateSafetySettings } from './slice';

const toNullOrNumber = (value) => (isEmpty(value) ? null : Number(value));

const validator = createValidator({
  criticalBatteryVoltage: optional(positive),
  lowBatteryVoltage: optional(positive),
  returnToHomeAltitude: optional(positive),
  returnToHomeSpeed: optional(positive),
});

const fields = [
  {
    id: 'criticalBatteryVoltage',
    label: 'Critical battery voltage',
    unit: 'V',
    description:
      'Critically low battery voltage in [V] under which a critical battery failsafe action is triggered.',
  },
  {
    id: 'lowBatteryVoltage',
    label: 'Low battery voltage',
    unit: 'V',
    description:
      'Low battery voltage in [V] under which a low battery failsafe action is triggered.',
  },
  {
    id: 'returnToHomeAltitude',
    label: 'Return to home altitude',
    unit: 'm',
    description:
      'Altitude in [mAHL] at which return to home operations are performed.',
  },
  {
    id: 'returnToHomeSpeed',
    label: 'Return to home speed',
    unit: 'm/s',
    description:
      'Horizontal speed in [m/s] at which return to home operations are performed.',
  },
];

const SafetySettingsFormPresentation = ({ initialValues, onSubmit }) => (
  <Form initialValues={initialValues} validate={validator} onSubmit={onSubmit}>
    {({ handleSubmit }) => (
      <form id='safetySettings' onSubmit={handleSubmit}>
        <DialogContentText id='alert-dialog-description'>
          Empty values result in the respective safety values not being
          overridden.
        </DialogContentText>
        {fields.map(({ id, label, unit, description }) => (
          <Box key={id} mt={1}>
            <TextField
              name={id}
              label={label}
              // Not `number`, because that would make distinguishing whether
              // a field is empty or contains invalid input impossible
              type='text'
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>{unit}</InputAdornment>
                ),
                inputProps: {
                  inputMode: 'numeric',
                },
              }}
              variant='filled'
            />
            <FormHelperText>{description}</FormHelperText>
          </Box>
        ))}
      </form>
    )}
  </Form>
);

SafetySettingsFormPresentation.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func,
};

const SafetySettingsForm = connect(
  // mapStateToProps
  (state) => ({
    initialValues: {
      ...mapValues(getSafetySettings(state), (v) => (v ? String(v) : '')),
    },
  })
)(SafetySettingsFormPresentation);

/**
 * Container of the tab that shows the form that the user can use to
 * edit the safety settings.
 */
const SafetySettingsTab = ({ onClose, onSubmit }) => (
  <>
    <DialogContent>
      <SafetySettingsForm onSubmit={onSubmit} />
    </DialogContent>
    <DialogActions>
      <Button form='safetySettings' type='submit' color='primary'>
        Save
      </Button>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </>
);

SafetySettingsTab.propTypes = {
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onSubmit: (data) => (dispatch) => {
      // `mapValues` doesn't work, because `react-final-form` drops empty values
      // dispatch(updateSafetySettings(mapValues(data, toNullOrNumber)));

      dispatch(
        updateSafetySettings({
          criticalBatteryVoltage: toNullOrNumber(data.criticalBatteryVoltage),
          lowBatteryVoltage: toNullOrNumber(data.lowBatteryVoltage),
          returnToHomeAltitude: toNullOrNumber(data.returnToHomeAltitude),
          returnToHomeSpeed: toNullOrNumber(data.returnToHomeSpeed),
        })
      );
    },
  }
)(SafetySettingsTab);
