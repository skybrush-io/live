import {
  addMinutes,
  endOfDay,
  fromUnixTime,
  getUnixTime,
  isPast,
  isValid,
  setSeconds,
  startOfDay,
} from 'date-fns';
import { KeyboardDatePicker, KeyboardTimePicker, Select } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';

import DateFnsUtils from '@date-io/date-fns';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormGroup from '@material-ui/core/FormGroup';
import MenuItem from '@material-ui/core/MenuItem';
import Typography from '@material-ui/core/Typography';
import AccessTime from '@material-ui/icons/AccessTime';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';

import Header from '@skybrush/mui-components/lib/FormHeader';

import { HMSDurationField } from '~/components/forms/fields';
import { CommonClockId } from '~/features/clocks/types';
import { StartMethod } from '~/features/show/enums';
import {
  closeStartTimeDialog,
  setStartMethod,
  setStartTime,
  synchronizeShowSettings,
} from '~/features/show/slice';
import { formatDurationHMS } from '~/utils/formatting';
import { parseDurationHMS } from '~/utils/parsing';

import StartTimeDisplay from './StartTimeDisplay';
import StartTimeSuggestions from './StartTimeSuggestions';

function createDateTimeFromParts(date, time) {
  const result = startOfDay(date);
  result.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
  return result;
}

function validateForm(values) {
  const errors = {};

  if (!isValid(values.utcDate)) {
    errors.utcDate = 'Invalid date';
  } else if (isPast(endOfDay(values.utcDate))) {
    errors.utcDate = 'Date cannot be in the past';
  } else if (!isValid(values.utcTime)) {
    errors.utcTime = 'Invalid time';
  } else {
    const dateTime = createDateTimeFromParts(values.utcDate, values.utcTime);
    if (isPast(dateTime)) {
      errors.utcTime = 'Time cannot be in the past';
    }
  }

  return errors;
}

/**
 * Form in the start time management dialog that keeps track of the changes
 * made by the user before the changes are submitted.
 */
const StartTimeForm = ({
  alwaysAllowSubmission,
  initialValues,
  onClose,
  onSubmit,
}) => (
  <Form
    initialValues={initialValues}
    validate={validateForm}
    onSubmit={onSubmit}
  >
    {({ dirty, form, handleSubmit, invalid, values }) => (
      <form id='start-time-form' onSubmit={handleSubmit}>
        <DialogContent>
          <StartTimeDisplay />

          <Box mt={2}>
            <Header>Set the start time of the show below</Header>
          </Box>

          <FormGroup row>
            <Box mr={1} minWidth={180}>
              <Select
                labelId='reference-clock-label'
                name='clock'
                label='Reference'
                formControlProps={{
                  fullWidth: true,
                  margin: 'dense',
                  variant: 'filled',
                }}
              >
                <MenuItem value={CommonClockId.LOCAL}>Local time</MenuItem>
                <MenuItem value={CommonClockId.MTC}>SMPTE timecode</MenuItem>
              </Select>
            </Box>

            {values.clock === CommonClockId.LOCAL ? (
              <>
                {/* we use separate pickers for the date and the time; this is
                 * because in most cases the date should default to the current
                 * day, but the time needs to be adjusted by the user */}

                <Box flex={1} mr={1}>
                  <KeyboardDatePicker
                    disablePast
                    format='yyyy-MM-dd'
                    fullWidth={false}
                    inputVariant='filled'
                    label='Start date'
                    margin='dense'
                    name='utcDate'
                    variant='dialog'
                  />
                </Box>
                <Box flex={1}>
                  <KeyboardTimePicker
                    ampm={false}
                    format='HH:mm:ss'
                    fullWidth={false}
                    inputVariant='filled'
                    keyboardIcon={<AccessTime />}
                    label='Start time'
                    margin='dense'
                    name='utcTime'
                    variant='dialog'
                  />
                </Box>
              </>
            ) : (
              <Box flex={1}>
                <HMSDurationField
                  label='Start time (hours:minutes:seconds)'
                  margin='dense'
                  name='timeOnClock'
                  variant='filled'
                />
              </Box>
            )}
          </FormGroup>

          {values.clock === CommonClockId.LOCAL && (
            <Box mt={1} flexDirection='row' display='flex' alignItems='center'>
              <Box mr={2}>
                <Typography variant='body2' color='textSecondary'>
                  Suggestions:
                </Typography>
              </Box>

              <StartTimeSuggestions
                onChange={(timestamp) => {
                  form.batch(() => {
                    const date = new Date(timestamp);
                    form.change('clock', CommonClockId.LOCAL);
                    form.change('utcDate', date);
                    form.change('utcTime', date);
                  });
                }}
              />
            </Box>
          )}

          <Select
            labelId='start-signal-label'
            name='method'
            label='Start signal'
            formControlProps={{
              fullWidth: true,
              margin: 'dense',
              variant: 'filled',
            }}
          >
            <MenuItem value={StartMethod.RC}>
              Start show with remote controller only (safer)
            </MenuItem>
            <MenuItem value={StartMethod.AUTO}>
              Start show automatically
            </MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button disabled={!dirty} onClick={() => form.reset()}>
            Reset form
          </Button>
          {onClose && <Button onClick={onClose}>Close</Button>}
          <Button
            color='primary'
            type='submit'
            disabled={invalid || (!alwaysAllowSubmission && !dirty)}
          >
            Set new start time
          </Button>
        </DialogActions>
      </form>
    )}
  </Form>
);

StartTimeForm.propTypes = {
  alwaysAllowSubmission: PropTypes.bool,
  initialValues: PropTypes.shape({
    clock: PropTypes.string,
    method: PropTypes.oneOf(Object.values(StartMethod)),
    timeOnClock: PropTypes.string,
  }),
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
};

/**
 * Presentation component for the dialog that allows the user to set up the
 * start time and the start metod of the drone show.
 */
const StartTimeDialog = ({
  clock,
  method,
  open,
  onClose,
  onUpdateSettings,
  timeOnClock,
  utcTime,
}) => {
  const hasUtcStartTime = typeof utcTime === 'number';
  const hasStartTimeOnClock = typeof timeOnClock === 'number';
  const startDateTimeInUtc = hasUtcStartTime
    ? fromUnixTime(utcTime)
    : setSeconds(addMinutes(new Date(), 30), 0);
  const initialStartTimeOnClock = hasStartTimeOnClock ? timeOnClock : 0;
  const initialClock =
    typeof clock === 'string' && clock.length > 0 ? clock : CommonClockId.LOCAL;

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Dialog fullWidth open={open} maxWidth='sm' onClose={onClose}>
        <StartTimeForm
          alwaysAllowSubmission={!hasUtcStartTime}
          initialValues={{
            method,
            clock: initialClock,
            timeOnClock: formatDurationHMS(initialStartTimeOnClock, {
              padHours: true,
            }),
            utcDate: startOfDay(startDateTimeInUtc),
            utcTime: startDateTimeInUtc,
          }}
          onClose={onClose}
          onSubmit={onUpdateSettings}
        />
      </Dialog>
    </MuiPickersUtilsProvider>
  );
};

StartTimeDialog.propTypes = {
  clock: PropTypes.string,
  method: PropTypes.oneOf(Object.values(StartMethod)),
  onClose: PropTypes.func,
  onUpdateSettings: PropTypes.func,
  open: PropTypes.bool,
  timeOnClock: PropTypes.number,
  utcTime: PropTypes.number,
};

StartTimeDialog.defaultProps = {
  method: StartMethod.RC,
  open: false,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.show.startTimeDialog,
    ...state.show.start,
  }),

  // mapDispatchToProps
  (dispatch) => ({
    onClose() {
      dispatch(closeStartTimeDialog());
    },

    onUpdateSettings({ clock, method, timeOnClock, utcDate, utcTime }) {
      const useLocalTime =
        clock === CommonClockId.LOCAL ||
        clock === '' ||
        typeof clock !== 'string';

      dispatch(setStartMethod(method));

      if (useLocalTime) {
        dispatch(
          setStartTime({
            time: getUnixTime(createDateTimeFromParts(utcDate, utcTime)),
            clock: null,
          })
        );
      } else {
        const parsedTime = parseDurationHMS(timeOnClock);
        dispatch(
          setStartTime({
            time: Number.isNaN(parsedTime) ? null : parsedTime,
            clock,
          })
        );
      }

      dispatch(synchronizeShowSettings('toServer'));
      dispatch(closeStartTimeDialog());
    },
  })
)(StartTimeDialog);
