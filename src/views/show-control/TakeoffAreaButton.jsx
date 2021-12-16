import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';
import { openTakeoffAreaSetupDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { getFarthestDistanceFromHome } from '~/features/uavs/selectors';
import { formatDistance } from '~/utils/formatting';

const formatStatusText = (status, maxDistance) => {
  if (typeof maxDistance === 'number') {
    if (Number.isFinite(maxDistance)) {
      return `Placement accuracy ≤ ${formatDistance(maxDistance)}`;
    } else {
      return 'No position yet for at least one drone';
    }
  }

  switch (status) {
    case Status.OFF:
    case Status.NEXT:
      return 'Place the drones in the takeoff area';

    case Status.SUCCESS:
      return 'Drone placement approved';

    case Status.ERROR:
      return 'Error in drone placement';

    case Status.SKIPPED:
      return 'Partial drone placement approved';

    case Status.WAITING:
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
      disabled={status === Status.OFF}
      onClick={onClick}
      {...rest}
    >
      <StatusLight status={status} />
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
  status: PropTypes.oneOf(Object.values(Status)),
};

TakeoffAreaButton.defaultProps = {};

export default connect(
  // mapStateToProps
  (state) => ({
    // TODO(ntamas): getFarthestDistanceFromHome() is recalculated all the time;
    // we need to fix this
    maxDistance:
      getSetupStageStatuses(state).setupTakeoffArea !== Status.OFF
        ? getFarthestDistanceFromHome(state)
        : undefined,
    status: getSetupStageStatuses(state).setupTakeoffArea,
  }),
  // mapDispatchToProps
  {
    onClick: openTakeoffAreaSetupDialog,
  }
)(TakeoffAreaButton);
