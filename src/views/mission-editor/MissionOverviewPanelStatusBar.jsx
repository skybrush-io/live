import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Chip from '@material-ui/core/Chip';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';

import Error from '@material-ui/icons/Error';
import Info from '@material-ui/icons/Info';
import Timeline from '@material-ui/icons/Timeline';
import Timer from '@material-ui/icons/Timer';
import Warning from '@material-ui/icons/Warning';

import Colors from '~/components/colors';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  getGPSBasedHomePositionsInMission,
  getMissionEstimates,
} from '~/features/mission/selectors';
import { formatDistance, formatDuration } from '~/utils/formatting';
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
  homePositions: [homePosition],
  missionEstimates: {
    distance: estimatedDistance,
    duration: estimatedDuration,
    error,
  },
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
      </Toolbar>
    </Paper>
  );
};

MissionOverviewPanelStatusBar.propTypes = {
  homePositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  missionEstimates: PropTypes.shape({
    distance: PropTypes.number,
    duration: PropTypes.number,
    error: PropTypes.string,
  }),
};

export default connect(
  // mapStateToProps
  (state) => ({
    homePositions: getGPSBasedHomePositionsInMission(state),
    missionEstimates: getMissionEstimates(state),
  }),
  // mapDispatchToProps
  {}
)(MissionOverviewPanelStatusBar);
