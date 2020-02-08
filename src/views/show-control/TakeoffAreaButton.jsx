import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StepperStatusLight, {
  StepperStatus
} from '~/components/StepperStatusLight';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Component with a button that shows a dialog that allows the user to check how
 * accurately the drones are placed in the takeoff area. The dialog also allows
 * the user to create virtual drones if needed.
 */
const TakeoffAreaButton = ({ status, ...rest }) => {
  return (
    <ListItem button {...rest}>
      <StepperStatusLight status={status} />
      <ListItemText
        primary="Setup takeoff area"
        secondary="Current maximum distance: 2.4 m"
      />
    </ListItem>
  );
};

TakeoffAreaButton.propTypes = {
  status: PropTypes.oneOf(Object.keys(StepperStatus))
};

TakeoffAreaButton.defaultProps = {};

export default connect(
  // mapStateToProps
  state => ({
    status: getSetupStageStatuses(state).setupTakeoffArea
  }),
  // mapDispatchToProps
  {
    // onEditEnvironment: openEnvironmentEditorDialog
  }
)(TakeoffAreaButton);
