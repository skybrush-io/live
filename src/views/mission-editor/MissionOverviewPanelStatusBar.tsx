import Error from '@mui/icons-material/Error';
import FilterList from '@mui/icons-material/FilterList';
import Info from '@mui/icons-material/Info';
import Timeline from '@mui/icons-material/Timeline';
import Timer from '@mui/icons-material/Timer';
import Warning from '@mui/icons-material/Warning';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import { useCallback } from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import Colors from '~/components/colors';
import ToggleButton from '~/components/ToggleButton';
import { UAVSelectorWrapper } from '~/components/uavs/UAVSelector';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  getGPSBasedHomePositionsInMission,
  getMissionEstimatesForMissionIndex,
  getSelectedMissionIdInMissionEditorPanel,
  shouldMissionEditorPanelFollowScroll,
} from '~/features/mission/selectors';
import {
  setEditorPanelFollowScroll,
  setEditorPanelSelectedMissionId,
} from '~/features/mission/slice';
import FollowScroll from '~/icons/FollowScroll';
import type { GPSPosition } from '~/model/geography';
import type { MissionIndex } from '~/model/missions';
import type { RootState } from '~/store/reducers';
import {
  formatDistance,
  formatDuration,
  formatMissionId,
} from '~/utils/formatting';

const useStyles = makeStyles((theme) => ({
  root: {
    background: theme.palette.action.hover,
    padding: theme.spacing(0.5, 1),
  },
}));

type MissionWarning = {
  key: string;
  text: string;
};

const makeWarningList = (warnings: MissionWarning[]) => (
  <ul style={{ paddingLeft: 28 }}>
    {warnings.map(({ key, text }) => (
      <li key={key}>{text}</li>
    ))}
  </ul>
);

type Props = {
  followScroll: boolean;
  homePositions: Array<GPSPosition | null>;
  missionEstimates: {
    distance: number;
    duration: number;
    error?: string;
  };
  onFollowScrollChanged: (value: boolean) => void;
  onSelectMissionId: (id?: MissionIndex) => void;
  selectedMissionId: MissionIndex | undefined;
};

const MissionOverviewPanelStatusBar = ({
  followScroll,
  homePositions: [homePosition],
  missionEstimates: {
    distance: estimatedDistance,
    duration: estimatedDuration,
    error,
  },
  onFollowScrollChanged,
  onSelectMissionId,
  selectedMissionId,
}: Props) => {
  const classes = useStyles();
  const warnings: MissionWarning[] = [];

  if (!homePosition) {
    warnings.push({
      key: 'home',
      text: 'Estimates are imprecise due to missing home position',
    });
  }

  if (!Number.isFinite(estimatedDuration)) {
    warnings.push({
      key: 'speed',
      text: 'Cannot estimate time due to missing speed information',
    });
  }

  const toggleFollowScroll = useCallback(() => {
    onFollowScrollChanged(!followScroll);
  }, [followScroll, onFollowScrollChanged]);

  return (
    <Paper square className={classes.root}>
      <Toolbar disableGutters variant='dense' style={{ minHeight: 28, gap: 8 }}>
        {selectedMissionId === undefined ? (
          <Chip
            icon={<Info style={{ color: Colors.info }} />}
            label={
              <span style={{ whiteSpace: 'normal' }}>
                Estimates are only available when filtering is active
              </span>
            }
            size='small'
            style={{ height: 'auto' }}
            variant='outlined'
          />
        ) : estimatedDistance > 0 ? (
          <>
            {warnings.length > 0 && (
              <Tooltip content={makeWarningList(warnings)} placement='top'>
                <Warning
                  style={{ color: Colors.warning, marginRight: 8 }}
                  fontSize='small'
                />
              </Tooltip>
            )}
            <Box sx={{ py: 0.25 }}>
              <Tooltip content='Estimated route'>
                <Chip
                  icon={<Timeline style={{ marginLeft: 6 }} />}
                  label={formatDistance(estimatedDistance)}
                  size='small'
                  style={{ margin: 2 }}
                  variant='outlined'
                />
              </Tooltip>
              <Tooltip content='Estimated time'>
                <Chip
                  icon={<Timer style={{ marginLeft: 6 }} />}
                  label={formatDuration(estimatedDuration)}
                  size='small'
                  style={{ margin: 2 }}
                  variant='outlined'
                />
              </Tooltip>
            </Box>
          </>
        ) : error ? (
          <Chip
            icon={<Error style={{ color: Colors.error }} />}
            label={<span style={{ whiteSpace: 'normal' }}>{error}</span>}
            size='small'
            style={{ height: 'auto' }}
            variant='outlined'
          />
        ) : (
          <Chip
            icon={<Info style={{ color: Colors.info }} />}
            label={
              <span style={{ whiteSpace: 'normal' }}>
                Add waypoints to the mission to get distance and duration
                estimates
              </span>
            }
            size='small'
            style={{ height: 'auto' }}
            variant='outlined'
          />
        )}
        <Box component='div' sx={{ flex: 1 }} />
        <UAVSelectorWrapper
          useMissionIds
          onSelect={({ missionIndex }) => onSelectMissionId(missionIndex)}
        >
          {(handleClick) => (
            <Chip
              clickable
              color={selectedMissionId === undefined ? 'default' : 'primary'}
              icon={<FilterList />}
              label={
                selectedMissionId === undefined
                  ? 'Filter'
                  : formatMissionId(selectedMissionId)
              }
              size='small'
              onClick={handleClick}
              onDelete={
                selectedMissionId === undefined
                  ? undefined
                  : () => void onSelectMissionId()
              }
            />
          )}
        </UAVSelectorWrapper>
        <Tooltip
          content={
            selectedMissionId === undefined
              ? 'Automatic scrolling is only available when filtering is active'
              : 'Follow the active mission item'
          }
        >
          {/* https://v4.mui.com/components/tooltips/#disabled-elements */}
          <span>
            <ToggleButton
              size='small'
              style={{ margin: -3 }}
              disabled={selectedMissionId === undefined}
              value='followScroll'
              selected={selectedMissionId !== undefined && followScroll}
              onChange={toggleFollowScroll}
            >
              <FollowScroll />
            </ToggleButton>
          </span>
        </Tooltip>
      </Toolbar>
    </Paper>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    followScroll: shouldMissionEditorPanelFollowScroll(state),
    homePositions: getGPSBasedHomePositionsInMission(state),
    missionEstimates: getMissionEstimatesForMissionIndex(
      // NOTE: Cast justified as the selector family also handles an
      // undefined mission index (no active filter), although its declared
      // parameter type is narrower than that.
      state,
      getSelectedMissionIdInMissionEditorPanel(state) as MissionIndex
    ),
    selectedMissionId: getSelectedMissionIdInMissionEditorPanel(state),
  }),
  // mapDispatchToProps
  {
    onFollowScrollChanged: setEditorPanelFollowScroll,
    onSelectMissionId: setEditorPanelSelectedMissionId,
  }
)(MissionOverviewPanelStatusBar);
