import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';
import { showGeofenceSettingsDialog } from '~/features/geofence/slice';
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
      return tt('');
  }
};

/**
 * Component with a button that shows a dialog that allows the user to create an
 * automatic geofence for the loaded show. The dialog also allows the user to
 * set parameters for the generation such as safety margin width and polygon
 * simplification.
 */
const GeofenceButton = ({ onClick, status, t, ...rest }) => {
  return (
    <ListItem
      button
      disabled={status === Status.OFF}
      onClick={onClick}
      {...rest}
    >
      <StatusLight status={status} />
      <ListItemText
        primary={t('show.setupGeofence', 'Setup geofence')}
        secondary={formatStatusText(status)(t)}
      />
    </ListItem>
  );
};

GeofenceButton.propTypes = {
  onClick: PropTypes.func,
  status: PropTypes.oneOf(Object.values(Status)),
  t: PropTypes.func,
};

GeofenceButton.defaultProps = {};

export default connect(
  // mapStateToProps
  (state) => ({
    status: getSetupStageStatuses(state).setupGeofence,
  }),
  // mapDispatchToProps
  {
    onClick: showGeofenceSettingsDialog,
  }
)(withTranslation()(GeofenceButton));
