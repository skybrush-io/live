import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StepperStatusLight, {
  StepperStatus
} from '~/components/StepperStatusLight';
import { openTakeoffAreaSetupDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { getFarthestDistanceFromHome } from '~/features/uavs/selectors';

/**
 * Component with a button that shows a dialog that allows the user to check how
 * accurately the drones are placed in the takeoff area. The dialog also allows
 * the user to create virtual drones if needed.
 */
const TakeoffAreaButton = ({ maxDistance, onClick, status, ...rest }) => {
  return (
    <ListItem button onClick={onClick} {...rest}>
      <StepperStatusLight status={status} />
      <ListItemText
        primary="Setup takeoff area"
        secondary={
          typeof maxDistance === 'number'
            ? `Current maximum distance: ${maxDistance.toFixed(2)} m`
            : 'Place the drones in the takeoff area'
        }
      />
    </ListItem>
  );
};

TakeoffAreaButton.propTypes = {
  maxDistance: PropTypes.number,
  onClick: PropTypes.func,
  status: PropTypes.oneOf(Object.keys(StepperStatus))
};

TakeoffAreaButton.defaultProps = {};

export default connect(
  // mapStateToProps
  state => ({
    // TODO(ntamas): getFarthestDistanceFromHome() is recalculated all the time;
    // we need to fix this
    maxDistance: getFarthestDistanceFromHome(state),
    status: getSetupStageStatuses(state).setupTakeoffArea
  }),
  // mapDispatchToProps
  {
    onClick: openTakeoffAreaSetupDialog
  }
)(TakeoffAreaButton);
