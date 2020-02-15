import {
  addMinutes,
  endOfDay,
  formatISO9075,
  fromUnixTime,
  getUnixTime,
  isPast,
  setSeconds,
  startOfDay
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
import AccessTime from '@material-ui/icons/AccessTime';
import Alert from '@material-ui/lab/Alert';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';

import Header from '~/components/dialogs/FormHeader';
import {
  closeStartTimeDialog,
  setStartMethod,
  setStartTime
} from '~/features/show/slice';

function createDateTimeFromParts(date, time) {
  const result = startOfDay(date);
  result.setHours(time.getHours(), time.getMinutes(), time.getSeconds());
  return result;
}

function validateForm(values) {
  const errors = {};

  if (isPast(endOfDay(values.date))) {
    errors.date = 'Date cannot be in the past';
  } else {
    const dateTime = createDateTimeFromParts(values.date, values.time);
    if (isPast(dateTime)) {
      errors.time = 'Time cannot be in the past';
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
  onClearStartTime,
  onSubmit,
  originalStartTime
}) => (
  <Form
    initialValues={initialValues}
    validate={validateForm}
    onSubmit={onSubmit}
  >
    {({ dirty, form, handleSubmit }) => (
      <form id="start-time-form" onSubmit={handleSubmit}>
        <DialogContent>
          <Alert
            severity={originalStartTime ? 'info' : 'warning'}
            variant="filled"
            onClose={originalStartTime ? onClearStartTime : null}
          >
            <Box>
              {originalStartTime ? (
                <>
                  Start time is set to{' '}
                  <strong>{formatISO9075(originalStartTime)}</strong>
                </>
              ) : (
                'No start time is set at the moment.'
              )}
            </Box>
          </Alert>

          <Box mt={2}>
            <Header>
              {originalStartTime
                ? 'Set a new start time below'
                : 'Set the start time of the show below'}
            </Header>
          </Box>

          {/* we use separate pickers for the date and the time; this is
           * because in most cases the date should default to the current
           * day, but the time needs to be adjusted by the user */}

          <FormGroup row>
            <Box flex={1} mr={1}>
              <KeyboardDatePicker
                disablePast
                format="yyyy-MM-dd"
                fullWidth={false}
                inputVariant="filled"
                label="Start date"
                margin="dense"
                name="date"
                variant="dialog"
              />
            </Box>
            <Box flex={1}>
              <KeyboardTimePicker
                ampm={false}
                format="HH:mm:ss"
                fullWidth={false}
                inputVariant="filled"
                keyboardIcon={<AccessTime />}
                label="Start time"
                margin="dense"
                name="time"
                variant="dialog"
              />
            </Box>
          </FormGroup>

          <Select
            labelId="start-signal-label"
            margin="dense"
            name="method"
            label="Start signal"
            formControlProps={{ fullWidth: true, variant: 'filled' }}
          >
            <MenuItem value="rc">
              Start show with remote controller (safer)
            </MenuItem>
            <MenuItem value="auto">Start show automatically</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button disabled={!dirty} onClick={() => form.reset()}>
            Reset
          </Button>
          <Button
            color="primary"
            type="submit"
            disabled={!alwaysAllowSubmission && !dirty}
          >
            Update
          </Button>
        </DialogActions>
      </form>
    )}
  </Form>
);

StartTimeForm.propTypes = {
  alwaysAllowSubmission: PropTypes.bool,
  initialValues: PropTypes.shape({
    method: PropTypes.oneOf(['rc', 'auto'])
  }),
  onClearStartTime: PropTypes.func,
  onSubmit: PropTypes.func,
  originalStartTime: PropTypes.instanceOf(Date)
};

/**
 * Presentation component for the dialog that allows the user to set up the
 * start time and the start metod of the drone show.
 */
const StartTimeDialog = ({
  method,
  open,
  onClearStartTime,
  onClose,
  onUpdateSettings,
  time
}) => {
  const hasStartTime = typeof time === 'number';
  const startDateTime = hasStartTime
    ? fromUnixTime(time)
    : setSeconds(addMinutes(new Date(), 30), 0);

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <Dialog fullWidth open={open} maxWidth="xs" onClose={onClose}>
        <StartTimeForm
          alwaysAllowSubmission={!hasStartTime}
          initialValues={{
            method,
            date: startOfDay(startDateTime),
            time: startDateTime
          }}
          originalStartTime={hasStartTime ? startDateTime : null}
          onClearStartTime={onClearStartTime}
          onSubmit={onUpdateSettings}
        />
      </Dialog>
    </MuiPickersUtilsProvider>
  );
};

StartTimeDialog.propTypes = {
  method: PropTypes.oneOf(['rc', 'auto']),
  onClearStartTime: PropTypes.func,
  onClose: PropTypes.func,
  onUpdateSettings: PropTypes.func,
  open: PropTypes.bool,
  time: PropTypes.number
};

StartTimeDialog.defaultProps = {
  method: 'rc',
  open: false
};

export default connect(
  // mapStateToProps
  state => ({
    ...state.show.startTimeDialog,
    ...state.show.start
  }),

  // mapDispatchToProps
  dispatch => ({
    onClearStartTime() {
      dispatch(setStartTime(null));
    },

    onClose() {
      dispatch(closeStartTimeDialog());
    },

    onUpdateSettings({ date, method, time }) {
      dispatch(setStartMethod(method));
      dispatch(setStartTime(getUnixTime(createDateTimeFromParts(date, time))));
    }
  })
)(StartTimeDialog);
