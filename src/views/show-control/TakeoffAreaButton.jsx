import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';
import { openTakeoffAreaSetupDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { getFarthestDistanceFromHome } from '~/features/uavs/selectors';
import { formatDistance } from '~/utils/formatting';

import { tt } from '~/i18n';

const formatStatusText = (status, maxDistance) => {
  if (typeof maxDistance === 'number') {
    if (Number.isFinite(maxDistance)) {
      return tt('show.placementAccuracy', {
        distance: formatDistance(maxDistance),
      });
    } else {
      return tt('show.takeOffNoPosition');
    }
  }

  switch (status) {
    case Status.OFF:
    case Status.NEXT:
      return tt('show.takeOffPlace');

    // ((t) => t('show.takeOffPlace', 'Place the drones in the takeoff area'))(t)

    case Status.SUCCESS:
      // return (t) => t('show.dronePlacementApproved');
      // return (t) => t('show.dronePlacementApproved');
      return tt('show.dronePlacementApproved');

    // ('Drone placement approved')(t)

    case Status.ERROR:
      return tt('show.dronePlacementError');

    case Status.SKIPPED:
      return tt('show.dronePlacementPartial');

    case Status.WAITING:
      return tt('show.dronePlacementCheck');

    default:
      return tt('');
  }
};

/**
 * Component with a button that shows a dialog that allows the user to check how
 * accurately the drones are placed in the takeoff area. The dialog also allows
 * the user to create virtual drones if needed.
 */
const TakeoffAreaButton = ({ maxDistance, onClick, status, t, ...rest }) => {
  return (
    <ListItem
      button
      disabled={status === Status.OFF}
      onClick={onClick}
      {...rest}
    >
      <StatusLight status={status} />
      <ListItemText
        primary={t('show.setupTakeoffArea', 'Setup takeoff area')}
        secondary={formatStatusText(status, maxDistance)(t)}
      />
    </ListItem>
  );
};

TakeoffAreaButton.propTypes = {
  maxDistance: PropTypes.number,
  onClick: PropTypes.func,
  status: PropTypes.oneOf(Object.values(Status)),
  t: PropTypes.func,
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
)(withTranslation()(TakeoffAreaButton));
