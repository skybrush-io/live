import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import DateFnsUtils from '@date-io/date-fns';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import {
  KeyboardDateTimePicker,
  MuiPickersUtilsProvider
} from '@material-ui/pickers';

import { closeStartTimeDialog } from '~/features/show/slice';

/**
 * Presentation component for the dialog that allows the user to set up the
 * start time and the start metod of the drone show.
 */
const StartTimeDialog = ({ method, open, onClose }) => {
  return (
    <Dialog fullWidth open={open} maxWidth="sm" onClose={onClose}>
      <DialogContent>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <FormControl fullWidth variant="filled">
            <InputLabel id="start-signal-label">Start signal</InputLabel>
            <Select
              labelId="start-signal-label"
              name="method"
              value={method}
              // onChange={props.onMethodChanged}
            >
              <MenuItem value="rc">
                Start show with remote controller (safer)
              </MenuItem>
              <MenuItem value="auto">Start show automatically</MenuItem>
            </Select>
          </FormControl>

          <KeyboardDateTimePicker
            disablePast
            inputVariant="filled"
            label="Start time"
            margin="dense"
            variant="inline"
            ampm={false}
            format="yyyy-MM-dd HH:mm:ss"
          />
        </MuiPickersUtilsProvider>
      </DialogContent>
      <DialogActions>
        <Button color="primary">Update settings</Button>
      </DialogActions>
    </Dialog>
  );
};

StartTimeDialog.propTypes = {
  method: PropTypes.oneOf(['rc', 'auto']),
  onClose: PropTypes.func,
  open: PropTypes.bool
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
  {
    onClose: closeStartTimeDialog
  }
)(StartTimeDialog);
