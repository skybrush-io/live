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
import TakeoffIcon from '@material-ui/icons/FlightTakeoff';
import LandIcon from '@material-ui/icons/FlightLand';
import HomeIcon from '@material-ui/icons/Home';

import Colors from '~/components/colors';
import { getMissionItemById } from '~/features/mission/selectors';
import { isMissionItemValid, MissionItemType } from '~/model/missions';
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

const MissionOverviewListItem = ({
  id,
  index,
  item,
  selected,
  onSelectItem,
}) => {
  const classes = useStyles();

  const { type } = item;
  const onClick = (event) => onSelectItem(event, id);

  let avatar;
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
        item.parameters?.velocity_xy + ' m/s horizontal, '
        + item.parameters?.velocity_z + ' m/s vertical';
      break;

    case MissionItemType.SET_PAYLOAD:
      avatar = <SetPayloadIcon />;
      primaryText = 'Set payload';
      secondaryText = item.parameters?.name + ': ' + item.parameters?.action;
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
  selected: PropTypes.bool,
  onSelectItem: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state, ownProps) => ({
    item: getMissionItemById(state, ownProps.id),
  }),
  // mapDispatchToProps
  {}
)(MissionOverviewListItem);
