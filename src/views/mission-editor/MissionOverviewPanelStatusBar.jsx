import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Chip from '@material-ui/core/Chip';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';

import Error from '@material-ui/icons/Error';
import Info from '@material-ui/icons/Info';
import Share from '@material-ui/icons/Share';
import Timer from '@material-ui/icons/Timer';
import Warning from '@material-ui/icons/Warning';

import Colors from '~/components/colors';
import ToolbarDivider from '~/components/ToolbarDivider';
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
      padding: theme.spacing(0, 1),
    },
  }),
  {
    name: 'MissionOverviewPanelToolbar',
  }
);

const makeWarningList = (warnings) => (
  <ul style={{ paddingLeft: '30px' }}>
    {warnings.map(({ key, text }) => (
      <li key={key}>{text}</li>
    ))}
  </ul>
);

const MissionOverviewPanelToolbar = ({
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
      <Toolbar
        disableGutters
        variant='dense'
        style={{ height: 36, minHeight: 36 }}
      >
        {estimatedDistance > 0 ? (
          <>
            {warnings.length > 0 && (
              <>
                <Tooltip content={makeWarningList(warnings)} placement='top'>
                  <Warning style={{ color: Colors.warning }} fontSize='small' />
                </Tooltip>
                <ToolbarDivider orientation='vertical' />
              </>
            )}
            <Chip
              icon={<Share />}
              size='small'
              variant='outlined'
              label={`Estimated route: ${formatDistance(estimatedDistance)}`}
            />
            <ToolbarDivider orientation='vertical' />
            <Chip
              icon={<Timer />}
              size='small'
              variant='outlined'
              label={`Estimated time: ${formatDuration(estimatedDuration)}`}
            />
          </>
        ) : error ? (
          <>
            <Error style={{ color: Colors.error }} fontSize='small' />
            {error}
          </>
        ) : (
          <>
            <Info style={{ color: Colors.info }} fontSize='small' />
            Add waypoints to the mission to get distance and duration estimates!
          </>
        )}
      </Toolbar>
    </Paper>
  );
};

MissionOverviewPanelToolbar.propTypes = {
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
)(MissionOverviewPanelToolbar);
