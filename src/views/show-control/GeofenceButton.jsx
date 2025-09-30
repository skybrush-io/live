import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';
import { SafetyDialogTab } from '~/features/safety/constants';
import { openSafetyDialog, setSafetyDialogTab } from '~/features/safety/slice';
import { getSetupStageStatuses } from '~/features/show/stages';
import { tt } from '~/i18n';

const formatStatusText = (status) => {
  switch (status) {
    case Status.OFF:
    case Status.NEXT:
      return tt('geofence.statusText.no');

    case Status.SUCCESS:
      return tt('geofence.statusText.automatic');

    case Status.WARNING:
      return tt('geofence.statusText.manual');

    case Status.ERROR:
      return tt('geofence.statusText.error');

    default:
      return '';
  }
};

/**
 * Component with a button that shows a dialog that allows the user to create an
 * automatic geofence for the loaded show. The dialog also allows the user to
 * set parameters for the generation such as safety margin width and polygon
 * simplification.
 */
const GeofenceButton = ({ onClick, status, ...rest }) => {
  const { t } = useTranslation();

  return (
    <ListItemButton
      disabled={status === Status.OFF}
      onClick={onClick}
      {...rest}
    >
      <StatusLight status={status} />
      <ListItemText
        primary={t('show.setupGeofence', 'Setup geofence')}
        secondary={formatStatusText(status)(t)}
      />
    </ListItemButton>
  );
};

GeofenceButton.propTypes = {
  onClick: PropTypes.func,
  status: PropTypes.oneOf(Object.values(Status)),
};

export default connect(
  // mapStateToProps
  (state) => ({
    status: getSetupStageStatuses(state).setupGeofence,
  }),
  // mapDispatchToProps
  {
    onClick: () => (dispatch) => {
      dispatch(setSafetyDialogTab(SafetyDialogTab.GEOFENCE));
      dispatch(openSafetyDialog());
    },
  }
)(GeofenceButton);
