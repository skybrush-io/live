import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StepperStatusLight, {
  StepperStatus,
} from '~/components/StepperStatusLight';
import { openTakeoffAreaSetupDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { getFarthestDistanceFromHome } from '~/features/uavs/selectors';

const formatStatusText = (status, maxDistance) => {
  if (typeof maxDistance === 'number') {
    return `Placement accuracy ≤ ${maxDistance.toFixed(2)} m`;
  }

  switch (status) {
    case StepperStatus.OFF:
    case StepperStatus.NEXT:
      return 'Place the drones in the takeoff area';

    case StepperStatus.COMPLETED:
      return 'Drone placement approved';

    case StepperStatus.ERROR:
      return 'Error in drone placement';

    case StepperStatus.SKIPPED:
      return 'Partial drone placement approved';

    case StepperStatus.WAITING:
      return 'Checking drone placement…';

    default:
      return '';
  }
};

/**
 * Component with a button that shows a dialog that allows the user to check how
 * accurately the drones are placed in the takeoff area. The dialog also allows
 * the user to create virtual drones if needed.
 */
const TakeoffAreaButton = ({ maxDistance, onClick, status, ...rest }) => {
  return (
    <ListItem
      button
      disabled={status === StepperStatus.OFF}
      onClick={onClick}
      {...rest}
    >
      <StepperStatusLight status={status} />
      <ListItemText
        primary='Setup takeoff area'
        secondary={formatStatusText(status, maxDistance)}
      />
    </ListItem>
  );
};

TakeoffAreaButton.propTypes = {
  maxDistance: PropTypes.number,
  onClick: PropTypes.func,
  status: PropTypes.oneOf(Object.values(StepperStatus)),
};

TakeoffAreaButton.defaultProps = {};

export default connect(
  // mapStateToProps
  (state) => ({
    // TODO(ntamas): getFarthestDistanceFromHome() is recalculated all the time;
    // we need to fix this
    maxDistance:
      getSetupStageStatuses(state).setupTakeoffArea === StepperStatus.NEXT
        ? getFarthestDistanceFromHome(state)
        : undefined,
    status: getSetupStageStatuses(state).setupTakeoffArea,
  }),
  // mapDispatchToProps
  {
    onClick: openTakeoffAreaSetupDialog,
  }
)(TakeoffAreaButton);
