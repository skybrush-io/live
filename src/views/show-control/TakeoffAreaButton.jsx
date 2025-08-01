import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';
import { openTakeoffAreaSetupDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { getFarthestDistanceFromHome } from '~/features/uavs/selectors';
import { tt } from '~/i18n';
import { formatDistance } from '~/utils/formatting';

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

    case Status.SUCCESS:
      return tt('show.dronePlacementApproved');

    case Status.ERROR:
      return tt('show.dronePlacementError');

    case Status.SKIPPED:
      return tt('show.dronePlacementPartial');

    case Status.WAITING:
      return tt('show.dronePlacementCheck');

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
  const { t } = useTranslation();

  return (
    <ListItemButton
      disabled={status === Status.OFF}
      onClick={onClick}
      {...rest}
    >
      <StatusLight status={status} />
      <ListItemText
        primary={t('show.setupTakeoffArea', 'Setup takeoff area')}
        secondary={formatStatusText(status, maxDistance)(t)}
      />
    </ListItemButton>
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
