import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';

import Error from '@material-ui/icons/Error';
import FilterList from '@material-ui/icons/FilterList';
import Info from '@material-ui/icons/Info';
import Timeline from '@material-ui/icons/Timeline';
import Timer from '@material-ui/icons/Timer';
import Warning from '@material-ui/icons/Warning';

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
import {
  formatDistance,
  formatDuration,
  formatMissionId,
} from '~/utils/formatting';
import CustomPropTypes from '~/utils/prop-types';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      background: theme.palette.action.hover,
      padding: theme.spacing(0.5, 1),
    },
  }),
  {
    name: 'MissionOverviewPanelStatusBar',
  }
);

const makeWarningList = (warnings) => (
  <ul style={{ paddingLeft: 28 }}>
    {warnings.map(({ key, text }) => (
      <li key={key}>{text}</li>
    ))}
  </ul>
);

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
}) => {
  const classes = useStyles();
  const warnings = [];

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
            <Box py={0.25}>
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
                estimates!
              </span>
            }
            size='small'
            style={{ height: 'auto' }}
            variant='outlined'
          />
        )}
        <Box component='div' flex={1} />
        <UAVSelectorWrapper useMissionIds onSelect={onSelectMissionId}>
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
                  : () => {
                      onSelectMissionId();
                    }
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

MissionOverviewPanelStatusBar.propTypes = {
  followScroll: PropTypes.bool,
  homePositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  missionEstimates: PropTypes.shape({
    distance: PropTypes.number,
    duration: PropTypes.number,
    error: PropTypes.string,
  }),
  onFollowScrollChanged: PropTypes.func,
  onSelectMissionId: PropTypes.func,
  selectedMissionId: PropTypes.number,
};

export default connect(
  // mapStateToProps
  (state) => ({
    followScroll: shouldMissionEditorPanelFollowScroll(state),
    homePositions: getGPSBasedHomePositionsInMission(state),
    missionEstimates: getMissionEstimatesForMissionIndex(
      state,
      getSelectedMissionIdInMissionEditorPanel(state)
    ),
    selectedMissionId: getSelectedMissionIdInMissionEditorPanel(state),
  }),
  // mapDispatchToProps
  {
    onFollowScrollChanged: setEditorPanelFollowScroll,
    onSelectMissionId: setEditorPanelSelectedMissionId,
  }
)(MissionOverviewPanelStatusBar);
