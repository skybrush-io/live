import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StepperStatusLight, {
  StepperStatus
} from '~/components/StepperStatusLight';
import { openEnvironmentEditorDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * Converts an environment type to a human-readable string.
 */
function environmentTypeToString(type) {
  switch (type) {
    case 'indoor':
      return 'Indoor';
    case 'outdoor':
      return 'Outdoor';
    default:
      return 'Unknown';
  }
}

/**
 * Component that shows a button that allows the user to change the type of the
 * show environment and to customize the origin of the show (for outdoor shows)
 * or the size of the stage (for indoor shows).
 */
const EnvironmentButton = ({ onEditEnvironment, status, type, ...rest }) => {
  return (
    <ListItem
      button
      disabled={status === StepperStatus.OFF}
      onClick={onEditEnvironment}
      {...rest}
    >
      <StepperStatusLight status={status} />
      <ListItemText
        primary="Setup environment"
        secondary={environmentTypeToString(type)}
      />
    </ListItem>
  );
};

EnvironmentButton.propTypes = {
  onEditEnvironment: PropTypes.func,
  status: PropTypes.oneOf(Object.values(StepperStatus)),
  type: PropTypes.string
};

EnvironmentButton.defaultProps = {
  type: 'outdoor'
};

export default connect(
  // mapStateToProps
  state => ({
    status: getSetupStageStatuses(state).setupEnvironment,
    type: state.show.environment.type
  }),
  // mapDispatchToProps
  {
    onEditEnvironment: openEnvironmentEditorDialog
  }
)(EnvironmentButton);
