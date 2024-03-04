import isEmpty from 'lodash-es/isEmpty';
import isNumber from 'lodash-es/isNumber';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Avatar from '@material-ui/core/Avatar';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';
import Settings from '@material-ui/icons/Settings';

import { Status } from '@skybrush/app-theme-material-ui';

import Colors from '~/components/colors';
import { editMissionItemParameters } from '~/features/mission/actions';
import {
  getGeofencePolygon,
  getMissionItemById,
  hasActiveGeofencePolygon,
  isWaypointMissionConvexHullInsideGeofence,
} from '~/features/mission/selectors';
import { SafetyDialogTab } from '~/features/safety/constants';
import { openSafetyDialog, setSafetyDialogTab } from '~/features/safety/slice';
import {
  iconForMissionItemType,
  isMissionItemValid,
  MissionItemType,
  MissionType,
  schemaForMissionItemType,
  titleForMissionItemType,
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

const formatMarkerStatusText = (marker, ratio) => {
  const descriptions = {
    start: 'Mission has started',
    end: 'Mission has ended',
  };

  const markerText =
    marker in descriptions ? descriptions[marker] : `Unknown marker: ${marker}`;
  const ratioText = isNumber(ratio) ? ` (ratio=${ratio.toFixed(4)})` : '';

  return markerText + ratioText;
};

const MissionOverviewListItem = ({
  editMissionItemParameters,
  id,
  index,
  item,
  missionGeofenceStatus,
  ratio,
  selected,
  onSelectItem,
  openGeofenceSettingsTab,
  openSafetySettingsTab,
}) => {
  const classes = useStyles();

  let avatar = iconForMissionItemType[item.type];
  let onClick = (event) => onSelectItem(event, id);
  let primaryText = titleForMissionItemType[item.type];
  let secondaryText;
  const isValid = isMissionItemValid(item);

  switch (item.type) {
    case MissionItemType.GO_TO:
      avatar = index;
      secondaryText = isValid
        ? formatCoordinate([item.parameters?.lon, item.parameters?.lat])
        : 'Invalid mission item';
      break;

    case MissionItemType.LAND:
      if (item.parameters.velocityZ) {
        secondaryText = `${item.parameters.velocityZ} m/s vertical`;
      }

      break;

    case MissionItemType.RETURN_TO_HOME:
      break;

    case MissionItemType.TAKEOFF:
      secondaryText = isValid
        ? safelyFormatAltitudeWithReference(
            item.parameters?.alt,
            'No altitude specified'
          )
        : 'Invalid mission item';
      break;

    case MissionItemType.CHANGE_ALTITUDE:
      secondaryText = isValid
        ? safelyFormatAltitudeWithReference(
            item.parameters?.alt,
            'No altitude specified'
          )
        : 'Invalid mission item';
      break;

    case MissionItemType.CHANGE_FLIGHT_MODE:
      secondaryText = `${item.parameters?.mode}`
      break;
  
    case MissionItemType.CHANGE_HEADING:
      secondaryText = isValid
        ? safelyFormatHeadingWithMode(
            item.parameters?.heading,
            'No heading specified'
          )
        : 'Invalid mission item';
      break;

    case MissionItemType.CHANGE_SPEED: {
      const { velocityXY, velocityZ } = item.parameters;
      const tags = [];
      if (typeof velocityXY === 'number') {
        tags.push(`${velocityXY} m/s horizontal`);
      }

      if (typeof velocityZ === 'number') {
        tags.push(`${velocityZ} m/s vertical`);
      }

      secondaryText = tags.join(', ');

      break;
    }

    case MissionItemType.MARKER:
      secondaryText = formatMarkerStatusText(
        item.parameters?.marker,
        item.parameters?.ratio
      );
      break;

    case MissionItemType.SET_PAYLOAD:
      const { name, action, value } = item.parameters;
      secondaryText = `${name}: ${action}` + (value !== undefined ? ` ${value}` : '');

      break;

    case MissionItemType.SET_PARAMETER:
      secondaryText = `${item.parameters?.name}=${item.parameters?.value}`;
      break;

    case MissionItemType.UPDATE_FLIGHT_AREA:
      // TODO
      //onClick = openFlightAreaSettingsTab;
      //secondaryText = formatFlightAreaStatusText(missionFlightAreaStatus);
      break;

    case MissionItemType.UPDATE_GEOFENCE:
      onClick = openGeofenceSettingsTab;
      secondaryText = formatGeofenceStatusText(missionGeofenceStatus);
      break;

    case MissionItemType.UPDATE_SAFETY:
      onClick = openSafetySettingsTab;
      break;

    default:
      avatar = iconForMissionItemType[MissionItemType.UNKNOWN];
      primaryText = titleForMissionItemType[MissionItemType.UNKNOWN];
      secondaryText = `Type = ${item.type}`;
      break;
  }

  return (
    <Box position='relative'>
      <div
        style={{
          position: 'absolute',
          height: '100%',

          backgroundColor: ratio === 1 ? Colors.success : Colors.info,
          opacity: 0.25,

          transition: '0.25s',
          width: `${(ratio ?? 0) * 100}%`,
        }}
      />
      <ListItem
        button
        dense
        selected={selected}
        onClick={onClick}
        ContainerComponent='div'
      >
        {avatar && (
          <ListItemAvatar>
            <Avatar className={isValid ? null : classes.error}>{avatar}</Avatar>
          </ListItemAvatar>
        )}
        <ListItemText primary={primaryText} secondary={secondaryText} />
        {editMissionItemParameters && (
          <ListItemSecondaryAction>
            <IconButton edge='end' onClick={editMissionItemParameters}>
              <Settings />
            </IconButton>
          </ListItemSecondaryAction>
        )}
      </ListItem>
    </Box>
  );
};

MissionOverviewListItem.propTypes = {
  editMissionItemParameters: PropTypes.func,
  id: PropTypes.string,
  index: PropTypes.number,
  item: PropTypes.shape({
    type: PropTypes.string,
    parameters: PropTypes.object,
  }),
  missionGeofenceStatus: PropTypes.oneOf(Object.values(Status)),
  ratio: PropTypes.number,
  selected: PropTypes.bool,
  onSelectItem: PropTypes.func,
  openGeofenceSettingsTab: PropTypes.func,
  openSafetySettingsTab: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state, ownProps) => ({
    item: getMissionItemById(state, ownProps.id) ?? {
      // HACK:Prevent a crash when react-virtuoso tries to render
      //      an item that no longer exists in the redux store...
      type: MissionItemType.UNKNOWN,
    },
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
    editMissionItemParameters,
    openGeofenceSettingsTab: () => (dispatch) => {
      dispatch(setSafetyDialogTab(SafetyDialogTab.GEOFENCE));
      dispatch(openSafetyDialog());
    },
    openSafetySettingsTab: () => (dispatch) => {
      dispatch(setSafetyDialogTab(SafetyDialogTab.SETTINGS));
      dispatch(openSafetyDialog());
    },
  },
  // mergeProps
  (stateProps, { editMissionItemParameters, ...dispatchProps }, ownProps) => ({
    ...ownProps,
    ...stateProps,
    ...dispatchProps,

    ...(!isEmpty(schemaForMissionItemType[stateProps.item.type].properties) && {
      editMissionItemParameters: () => editMissionItemParameters(ownProps.id),
    }),
  })
)(MissionOverviewListItem);
