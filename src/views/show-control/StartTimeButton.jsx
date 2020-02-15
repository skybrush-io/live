import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StepperStatusLight, {
  StepperStatus
} from '~/components/StepperStatusLight';
import { getShowStartTimeAsString } from '~/features/show/selectors';
import { openStartTimeDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Component with a button that shows a dialog that allows the user to set up
 * the preferred start time of the show.
 */
const StartTimeButton = ({ formattedStartTime, onClick, status, ...rest }) => {
  return (
    <ListItem
      button
      disabled={false && status === StepperStatus.OFF}
      onClick={onClick}
      {...rest}
    >
      <StepperStatusLight status={status} />
      <ListItemText
        primary="Choose start time"
        secondary={
          formattedStartTime ? `Starts at ${formattedStartTime}` : 'Not set yet'
        }
      />
    </ListItem>
  );
};

StartTimeButton.propTypes = {
  formattedStartTime: PropTypes.string,
  onClick: PropTypes.func,
  status: PropTypes.oneOf(Object.values(StepperStatus))
};

StartTimeButton.defaultProps = {};

export default connect(
  // mapStateToProps
  state => ({
    ...state.show.start,
    formattedStartTime: getShowStartTimeAsString(state),
    status: getSetupStageStatuses(state).setupStartTime
  }),
  // mapDispatchToProps
  {
    onClick: openStartTimeDialog
  }
)(StartTimeButton);
