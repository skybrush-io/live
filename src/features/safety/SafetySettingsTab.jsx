/**
 * @file Tab that shows the safety settings and allows the user to edit them.
 */

import { Select, TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import FormHelperText from '@material-ui/core/FormHelperText';
import InputAdornment from '@material-ui/core/InputAdornment';
import MenuItem from '@material-ui/core/MenuItem';

import {
  between,
  join,
  optional,
  positive,
  required,
} from '~/utils/validation';

import { BatteryThresholdType, unitForBatteryThresholdType } from './model';
import { getSafetySettings } from './selectors';
import { updateSafetySettings } from './slice';

const toNumberIfDefined = (value) => value && Number(value);

// TODO: Move this to `~/components/forms/fields.jsx`
const NumericFieldWithUnit = ({ unit, ...rest }) => (
  <TextField
    // Not `number`, because that would make distinguishing whether
    // a field is empty or contains invalid input impossible
    type='text'
    InputProps={{
      endAdornment: <InputAdornment position='end'>{unit}</InputAdornment>,
      inputProps: {
        inputMode: 'numeric',
      },
    }}
    variant='filled'
    {...rest}
  />
);

NumericFieldWithUnit.propTypes = {
  unit: PropTypes.string,
};

const validator = (values) => ({
  criticalBatteryVoltage: optional(positive)(values.criticalBatteryVoltage),
  lowBatteryThreshold: {
    value: {
      [BatteryThresholdType.VOLTAGE]: positive,
      [BatteryThresholdType.PERCENTAGE]: join([required, between(1, 100)]),
    }[values.lowBatteryThreshold?.type]?.(values.lowBatteryThreshold?.value),
  },
  returnToHomeAltitude: optional(positive)(values.returnToHomeAltitude),
  returnToHomeSpeed: optional(positive)(values.returnToHomeSpeed),
});

const SafetySettingsFormPresentation = ({ initialValues, onSubmit, t }) => (
  <Form initialValues={initialValues} validate={validator} onSubmit={onSubmit}>
    {({ handleSubmit, values }) => (
      <form id='safetySettings' onSubmit={handleSubmit}>
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingTop: 12,
          }}
        >
          <DialogContentText>
            {t('safetySettingsTab.emptyValues')}
          </DialogContentText>
          <Box>
            <NumericFieldWithUnit
              name='criticalBatteryVoltage'
              label={t('safetySettingsTab.criticalBatteryVoltageLabel')}
              unit='V'
            />
            <FormHelperText>
              {t('safetySettingsTab.criticalBatteryVoltageHelperText')}
            </FormHelperText>
          </Box>
          <Box>
            <Box display='flex'>
              {/* TODO: Use `Select` from `~/components/forms/fields.jsx` */}
              <Select
                name='lowBatteryThreshold.type'
                label={t('safetySettingsTab.lowBatteryThresholdTypeLabel')}
                variant='filled'
              >
                <MenuItem>
                  {t('safetySettingsTab.lowBatteryThresholdType.noOverride')}
                </MenuItem>
                <MenuItem value={BatteryThresholdType.OFF}>
                  {t('safetySettingsTab.lowBatteryThresholdType.disabled')}
                </MenuItem>
                <MenuItem value={BatteryThresholdType.VOLTAGE}>
                  {t('safetySettingsTab.lowBatteryThresholdType.voltageBased')}
                </MenuItem>
                <MenuItem value={BatteryThresholdType.PERCENTAGE}>
                  {t(
                    'safetySettingsTab.lowBatteryThresholdType.percentageBased'
                  )}
                </MenuItem>
              </Select>
              {[
                BatteryThresholdType.VOLTAGE,
                BatteryThresholdType.PERCENTAGE,
              ].includes(values.lowBatteryThreshold?.type) && (
                <>
                  <Box p={1} />
                  <NumericFieldWithUnit
                    name='lowBatteryThreshold.value'
                    label={t('safetySettingsTab.lowBatteryThresholdValueLabel')}
                    unit={
                      unitForBatteryThresholdType[
                        values.lowBatteryThreshold?.type
                      ]
                    }
                    style={{ flexShrink: 1.25 }}
                  />
                </>
              )}
            </Box>
            <FormHelperText>
              {t('safetySettingsTab.lowBatteryThresholdHelperText')}
            </FormHelperText>
          </Box>
          <Box>
            <NumericFieldWithUnit
              name='returnToHomeAltitude'
              label={t('safetySettingsTab.returnToHomeAltitudeLabel')}
              unit='m'
            />
            <FormHelperText>
              {t('safetySettingsTab.returnToHomeAltitudeHelperText')}
            </FormHelperText>
          </Box>
          <Box>
            <NumericFieldWithUnit
              name='returnToHomeSpeed'
              label={t('safetySettingsTab.returnToHomeSpeedLabel')}
              unit='m/s'
            />
            <FormHelperText>
              {t('safetySettingsTab.returnToHomeSpeedHelperText')}
            </FormHelperText>
          </Box>
        </Box>
      </form>
    )}
  </Form>
);

SafetySettingsFormPresentation.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func,
  t: PropTypes.func,
};

const SafetySettingsForm = connect(
  // mapStateToProps
  (state) => ({
    initialValues: getSafetySettings(state),
  }),
  // mapDispatchToProps
  {
    onSubmit: (values) => (dispatch) => {
      dispatch(
        updateSafetySettings({
          criticalBatteryVoltage: toNumberIfDefined(
            values.criticalBatteryVoltage
          ),
          lowBatteryThreshold: values.lowBatteryThreshold?.type && {
            type: values.lowBatteryThreshold.type,
            ...([
              BatteryThresholdType.VOLTAGE,
              BatteryThresholdType.PERCENTAGE,
            ].includes(values.lowBatteryThreshold.type) && {
              value: Number(values.lowBatteryThreshold.value),
            }),
          },
          returnToHomeAltitude: toNumberIfDefined(values.returnToHomeAltitude),
          returnToHomeSpeed: toNumberIfDefined(values.returnToHomeSpeed),
        })
      );
    },
  }
)(withTranslation()(SafetySettingsFormPresentation));

/**
 * Container of the tab that shows the form that the user can use to
 * edit the safety settings.
 */
const SafetySettingsTabPresentation = ({ onClose, t }) => (
  <>
    <DialogContent>
      <SafetySettingsForm />
    </DialogContent>
    <DialogActions>
      <Button form='safetySettings' type='submit' color='primary'>
        {t('general.action.save')}
      </Button>
      <Button onClick={onClose}>{t('general.action.close')}</Button>
    </DialogActions>
  </>
);

SafetySettingsTabPresentation.propTypes = {
  onClose: PropTypes.func,
  t: PropTypes.func,
};

export default withTranslation()(SafetySettingsTabPresentation);
