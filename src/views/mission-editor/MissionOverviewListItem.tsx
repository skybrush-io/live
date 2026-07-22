import Settings from '@mui/icons-material/Settings';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { useTheme } from '@mui/material/styles';
import createColor from 'color';
import isEmpty from 'lodash-es/isEmpty';
import type { MouseEvent } from 'react';
import { connect } from 'react-redux';

import { makeStyles, Status } from '@skybrush/app-theme-mui';

import Colors from '~/components/colors';
import { editMissionItemParameters } from '~/features/mission/actions';
import {
  getCompletionRatiosForMissionItemById,
  getGeofencePolygon,
  getMissionItemById,
  hasActiveGeofencePolygon,
  isWaypointMissionConvexHullInsideGeofence,
} from '~/features/mission/selectors';
import { SafetyDialogTab } from '~/features/safety/constants';
import { openSafetyDialog, setSafetyDialogTab } from '~/features/safety/slice';
import type { MissionItem } from '~/model/missions';
import {
  iconForMissionItemType,
  isMissionItemValid,
  MissionItemType,
  MissionType,
  schemaForMissionItemType,
  titleForMissionItemType,
} from '~/model/missions';
import type { AppDispatch, RootState } from '~/store/reducers';
import {
  formatIdsAndTruncateTrailingItems,
  formatMissionId,
} from '~/utils/formatting';
import {
  formatCoordinate,
  safelyFormatAltitudeWithReference,
  safelyFormatHeadingWithMode,
} from '~/utils/geography';

const useStyles = makeStyles((theme) => ({
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
}));

// TODO: Reduce code duplication from `GeofenceButton.jsx`
const formatGeofenceStatusText = (status: Status): string => {
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

const formatMarkerStatusText = (
  marker: string | undefined,
  ratio: number | undefined
): string => {
  const descriptions: Record<string, string> = {
    start: 'Mission has started',
    end: 'Mission has ended',
  };

  const markerText =
    marker !== undefined && marker in descriptions
      ? descriptions[marker]
      : `Unknown marker: ${marker}`;
  const ratioText =
    typeof ratio === 'number' ? ` (ratio=${ratio.toFixed(4)})` : '';

  return markerText + ratioText;
};

type ItemProgressProps = {
  color: string;
  ratio: number;
};

const ItemProgress = ({ color, ratio }: ItemProgressProps) => {
  const theme = useTheme();

  return (
    <div
      style={{
        position: 'absolute',
        height: '100%',
        transition: '0.25s',
        backgroundColor: createColor(theme.palette.background.paper)
          .mix(createColor(color), 0.25)
          .string(),
        width: `${ratio * 100}%`,
      }}
    />
  );
};

type CompletionRatios = {
  avg: number | undefined;
  max: number | undefined;
  min: number | undefined;
};

type OwnProps = {
  id: string;
  index: number;
  ratio?: number;
  selected: boolean;
  selectedMissionId: number | undefined;
  onSelectItem: (id: string, event: MouseEvent) => void;
};

type StateProps = {
  editMissionItemParameters?: () => void;
  item: MissionItem;
  missionGeofenceStatus: Status;
  ratios: CompletionRatios;
};

type DispatchProps = {
  openGeofenceSettingsTab: () => void;
  openSafetySettingsTab: () => void;
};

type Props = OwnProps & StateProps & DispatchProps;

const MissionOverviewListItem = ({
  editMissionItemParameters,
  id,
  index,
  item,
  missionGeofenceStatus,
  ratio,
  ratios,
  selected,
  selectedMissionId,
  onSelectItem,
  openGeofenceSettingsTab,
  openSafetySettingsTab,
}: Props) => {
  const classes = useStyles();

  let avatar = iconForMissionItemType[item.type];
  let onClick = onSelectItem.bind(null, id);
  let primaryText = titleForMissionItemType[item.type];
  let secondaryText: string | undefined;
  const isValid = isMissionItemValid(item);

  switch (item.type) {
    case MissionItemType.GO_TO:
      avatar = String(index + 1);
      secondaryText = isValid
        ? formatCoordinate([item.parameters?.lon, item.parameters?.lat])
        : 'Invalid mission item';
      break;

    case MissionItemType.HOVER:
      secondaryText = isValid
        ? `for ${item.parameters.duration} seconds`
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
      secondaryText = `${item.parameters?.mode}`;
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
      const tags: string[] = [];
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

    case MissionItemType.SET_PAYLOAD: {
      const { name, action, value } = item.parameters;
      secondaryText =
        `${name}: ${action}` + (value === undefined ? '' : ` ${value}`);

      break;
    }

    case MissionItemType.SET_PARAMETER:
      secondaryText = `${item.parameters?.name}=${item.parameters?.value}`;
      break;

    case MissionItemType.UPDATE_FLIGHT_AREA:
      // TODO:
      // onClick = openFlightAreaSettingsTab;
      // secondaryText = formatFlightAreaStatusText(missionFlightAreaStatus);
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
    <Box sx={{ position: 'relative' }}>
      {selectedMissionId === undefined ? (
        <>
          <ItemProgress color={Colors.missionItem} ratio={ratios.max ?? 0} />
          <ItemProgress
            color={Colors.currentMissionItem}
            ratio={ratios.avg ?? 0}
          />
          <ItemProgress
            color={Colors.doneMissionItem}
            ratio={ratios.min ?? 0}
          />
        </>
      ) : (
        <ItemProgress
          color={ratio === 1 ? Colors.doneMissionItem : Colors.missionItem}
          ratio={ratio ?? 0}
        />
      )}
      <ListItem
        disablePadding
        secondaryAction={
          editMissionItemParameters ? (
            <IconButton
              edge='end'
              size='large'
              onClick={editMissionItemParameters}
            >
              <Settings />
            </IconButton>
          ) : undefined
        }
      >
        <ListItemButton dense selected={selected} onClick={onClick}>
          {avatar && (
            <ListItemAvatar>
              <Badge
                badgeContent={
                  item.participants === undefined
                    ? undefined
                    : formatIdsAndTruncateTrailingItems(
                        item.participants.map(formatMissionId),
                        { maxCount: 3, separator: ', ' }
                      )
                }
                color='primary'
                overlap='circular'
                sx={{ whiteSpace: 'nowrap' }}
              >
                <Avatar className={isValid ? undefined : classes.error}>
                  {avatar}
                </Avatar>
              </Badge>
            </ListItemAvatar>
          )}
          <ListItemText primary={primaryText} secondary={secondaryText} />
        </ListItemButton>
      </ListItem>
    </Box>
  );
};

// TODO: This should really be cleaned up by making sure that Virtuoso only
//       renders items that are actually present in the store, or at least by
//       introducing a wrapper component to check whether a given mission item
//       exists before trying to render it
export default connect(
  // mapStateToProps
  (state: RootState, ownProps: OwnProps) => ({
    item: (getMissionItemById(state, ownProps.id) ?? {
      // HACK:Prevent a crash when react-virtuoso tries to render
      //      an item that no longer exists in the redux store...
      type: MissionItemType.UNKNOWN,
    }) as MissionItem,
    missionGeofenceStatus: hasActiveGeofencePolygon(state)
      ? isWaypointMissionConvexHullInsideGeofence(state)
        ? getGeofencePolygon(state)?.owner === MissionType.WAYPOINT
          ? Status.SUCCESS
          : Status.WARNING
        : Status.ERROR
      : Status.OFF,
    // HACK: The only thing preventing this from crashing on no longer existing
    //       mission items is the fallback in case of missing participant
    //       information to belonging to all mission indices
    ratios: getCompletionRatiosForMissionItemById(state, ownProps.id),
  }),
  // mapDispatchToProps
  {
    editMissionItemParameters,
    openGeofenceSettingsTab: () => (dispatch: AppDispatch) => {
      dispatch(setSafetyDialogTab(SafetyDialogTab.GEOFENCE));
      dispatch(openSafetyDialog());
    },
    openSafetySettingsTab: () => (dispatch: AppDispatch) => {
      dispatch(setSafetyDialogTab(SafetyDialogTab.SETTINGS));
      dispatch(openSafetyDialog());
    },
  },
  // mergeProps
  (
    stateProps,
    { editMissionItemParameters: editFn, ...dispatchProps },
    ownProps
  ) => ({
    ...ownProps,
    ...stateProps,
    ...dispatchProps,

    ...(!isEmpty(schemaForMissionItemType[stateProps.item.type].properties) && {
      editMissionItemParameters: () => editFn?.(ownProps.id),
    }),
  })
)(MissionOverviewListItem);
