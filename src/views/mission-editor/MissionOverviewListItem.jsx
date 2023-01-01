import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Avatar from '@material-ui/core/Avatar';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';
import ChangeAltitudeIcon from '@material-ui/icons/Height';
import ChangeHeadingIcon from '@material-ui/icons/RotateLeft';
import ChangeSpeedIcon from '@material-ui/icons/Speed';
import SetPayloadIcon from '@material-ui/icons/Camera';
import SetParameterIcon from '@material-ui/icons/Settings';
import TakeoffIcon from '@material-ui/icons/FlightTakeoff';
import UpdateGeofenceIcon from '~/icons/PlacesFence';
import LandIcon from '@material-ui/icons/FlightLand';
import HomeIcon from '@material-ui/icons/Home';

import { Status } from '@skybrush/app-theme-material-ui';

import Colors from '~/components/colors';
import { showGeofenceSettingsDialog } from '~/features/geofence/slice';
import {
  getGeofencePolygon,
  getMissionItemById,
  hasActiveGeofencePolygon,
  isWaypointMissionConvexHullInsideGeofence,
} from '~/features/mission/selectors';
import {
  isMissionItemValid,
  MissionItemType,
  MissionType,
} from '~/model/missions';
import {
  safelyFormatAltitudeWithReference,
  safelyFormatHeadingWithMode,
  formatCoordinate,
} from '~/utils/geography';

const useStyles = makeStyles(
  (theme) => ({
    error: {
      backgroundColor: Colors.error,
      color: theme.palette.getContrastText(Colors.error),
    },
    success: {
      backgroundColor: Colors.success,
      color: theme.palette.getContrastText(Colors.success),
    },
    warning: {
      backgroundColor: Colors.warning,
      color: theme.palette.getContrastText(Colors.warning),
    },
  }),
  { name: 'MissionOverviewListItem' }
);

// TODO: Reduce code duplication from `GeofenceButton.jsx`
const formatGeofenceStatusText = (status) => {
  switch (status) {
    case Status.OFF:
      return 'No geofence defined yet';

    case Status.SUCCESS:
      return 'Automatic geofence in use';

    case Status.WARNING:
      return 'Manual geofence in use';

    case Status.ERROR:
      return 'Mission area lies outside the geofence';

    default:
      return '';
  }
};

const MissionOverviewListItem = ({
  id,
  index,
  item,
  missionGeofenceStatus,
  selected,
  showGeofenceSettingsDialog,
  onSelectItem,
}) => {
  const classes = useStyles();

  const { type } = item;

  let avatar;
  let onClick = (event) => onSelectItem(event, id);
  let primaryText;
  let secondaryText;
  const isValid = isMissionItemValid(item);

  switch (type) {
    case MissionItemType.GO_TO:
      avatar = index;
      primaryText = 'Go to waypoint';
      secondaryText = isValid
        ? formatCoordinate([item.parameters?.lon, item.parameters?.lat])
        : 'Invalid mission item';
      break;

    case MissionItemType.LAND:
      avatar = <LandIcon />;
      primaryText = 'Land';
      break;

    case MissionItemType.RETURN_TO_HOME:
      avatar = <HomeIcon />;
      primaryText = 'Return to home';
      break;

    case MissionItemType.TAKEOFF:
      avatar = <TakeoffIcon />;
      primaryText = 'Takeoff';
      secondaryText = isValid
        ? safelyFormatAltitudeWithReference(
            item.parameters?.alt,
            'No altitude specified'
          )
        : 'Invalid mission item';
      break;

    case MissionItemType.CHANGE_ALTITUDE:
      avatar = <ChangeAltitudeIcon />;
      primaryText = 'Change altitude';
      secondaryText = isValid
        ? safelyFormatAltitudeWithReference(
            item.parameters?.alt,
            'No altitude specified'
          )
        : 'Invalid mission item';
      break;

    case MissionItemType.CHANGE_HEADING:
      avatar = <ChangeHeadingIcon />;
      primaryText = 'Change heading';
      secondaryText = isValid
        ? safelyFormatHeadingWithMode(
            item.parameters?.heading,
            'No heading specified'
          )
        : 'Invalid mission item';
      break;

    case MissionItemType.CHANGE_SPEED:
      avatar = <ChangeSpeedIcon />;
      primaryText = 'Change speed';
      secondaryText =
        `${item.parameters?.velocityXY} m/s horizontal, ` +
        `${item.parameters?.velocityZ} m/s vertical`;
      break;

    case MissionItemType.SET_PAYLOAD:
      avatar = <SetPayloadIcon />;
      primaryText = 'Set payload';
      secondaryText = `${item.parameters?.name}: ${item.parameters?.action}`;
      break;

    case MissionItemType.SET_PARAMETER:
      avatar = <SetParameterIcon />;
      primaryText = 'Set parameter';
      secondaryText = `${item.parameters?.name}=${item.parameters?.value}`;
      break;

    case MissionItemType.UPDATE_GEOFENCE:
      avatar = <UpdateGeofenceIcon />;
      onClick = showGeofenceSettingsDialog;
      primaryText = 'Update geofence';
      secondaryText = formatGeofenceStatusText(missionGeofenceStatus);
      break;

    default:
      avatar = '?';
      primaryText = 'Unknown mission item';
      secondaryText = `Type = ${type}`;
      break;
  }

  return (
    <ListItem button dense selected={selected} onClick={onClick}>
      {avatar && (
        <ListItemAvatar>
          <Avatar className={isValid ? null : classes.error}>{avatar}</Avatar>
        </ListItemAvatar>
      )}
      <ListItemText primary={primaryText} secondary={secondaryText} />
    </ListItem>
  );
};

MissionOverviewListItem.propTypes = {
  id: PropTypes.string,
  index: PropTypes.number,
  item: PropTypes.shape({
    type: PropTypes.string,
    parameters: PropTypes.object,
  }),
  missionGeofenceStatus: PropTypes.oneOf(Object.values(Status)),
  selected: PropTypes.bool,
  showGeofenceSettingsDialog: PropTypes.func,
  onSelectItem: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state, ownProps) => ({
    item: getMissionItemById(state, ownProps.id),
    missionGeofenceStatus: hasActiveGeofencePolygon(state)
      ? isWaypointMissionConvexHullInsideGeofence(state)
        ? getGeofencePolygon(state).owner === MissionType.WAYPOINT
          ? Status.SUCCESS
          : Status.WARNING
        : Status.ERROR
      : Status.OFF,
  }),
  // mapDispatchToProps
  {
    showGeofenceSettingsDialog,
  }
)(MissionOverviewListItem);