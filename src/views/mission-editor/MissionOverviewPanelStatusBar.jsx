import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Chip from '@material-ui/core/Chip';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';

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

const MissionOverviewPanelToolbar = ({
  homePositions: [homePosition],
  missionEstimates: {
    distance: estimatedDistance,
    duration: estimatedDuration,
  },
}) => {
  const classes = useStyles();
  return (
    <Paper square className={classes.root}>
      <Toolbar
        disableGutters
        variant='dense'
        style={{ height: 36, minHeight: 36 }}
      >
        {homePosition ? null : (
          <>
            <Tooltip
              content='Estimates are imprecise due to missing home position'
              placement='top'
            >
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
      </Toolbar>
    </Paper>
  );
};

MissionOverviewPanelToolbar.propTypes = {
  homePositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  missionEstimates: PropTypes.shape({
    distance: PropTypes.number,
    duration: PropTypes.number,
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
