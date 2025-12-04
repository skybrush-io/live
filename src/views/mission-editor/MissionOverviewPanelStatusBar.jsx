import Error from '@mui/icons-material/Error';
import Info from '@mui/icons-material/Info';
import Timeline from '@mui/icons-material/Timeline';
import Timer from '@mui/icons-material/Timer';
import Warning from '@mui/icons-material/Warning';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import Colors from '~/components/colors';
import ToggleButton from '~/components/ToggleButton';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  getGPSBasedHomePositionsInMission,
  getMissionEstimates,
  shouldMissionEditorPanelFollowScroll,
} from '~/features/mission/selectors';
import { setEditorPanelFollowScroll } from '~/features/mission/slice';
import FollowScroll from '~/icons/FollowScroll';
import { formatDistance, formatDuration } from '~/utils/formatting';
import CustomPropTypes from '~/utils/prop-types';

const useStyles = makeStyles((theme) => ({
  root: {
    background: theme.palette.action.hover,
    padding: theme.spacing(0.5, 1),
  },
}));

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
      <Toolbar disableGutters variant='dense' style={{ minHeight: 28 }}>
        {estimatedDistance > 0 ? (
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
            style={{ height: 'auto', marginRight: 8 }}
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
            style={{ height: 'auto', marginRight: 8 }}
            variant='outlined'
          />
        )}
        <Box component='div' sx={{ flex: 1 }} />
        <Tooltip content='Follow the active mission item'>
          <ToggleButton
            size='small'
            style={{ margin: -3 }}
            value='followScroll'
            selected={followScroll}
            onChange={toggleFollowScroll}
          >
            <FollowScroll />
          </ToggleButton>
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
};

export default connect(
  // mapStateToProps
  (state) => ({
    followScroll: shouldMissionEditorPanelFollowScroll(state),
    homePositions: getGPSBasedHomePositionsInMission(state),
    missionEstimates: getMissionEstimates(state),
  }),
  // mapDispatchToProps
  {
    onFollowScrollChanged: setEditorPanelFollowScroll,
  }
)(MissionOverviewPanelStatusBar);
