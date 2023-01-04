import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Chip from '@material-ui/core/Chip';
import Paper from '@material-ui/core/Paper';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';

import Share from '@material-ui/icons/Share';
import Timer from '@material-ui/icons/Timer';

import ToolbarDivider from '~/components/ToolbarDivider';
import { getMissionEstimates } from '~/features/mission/selectors';
import { formatDistance, formatDuration } from '~/utils/formatting';

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
  missionEstimates: PropTypes.shape({
    distance: PropTypes.number,
    duration: PropTypes.number,
  }),
};

export default connect(
  // mapStateToProps
  (state) => ({
    missionEstimates: getMissionEstimates(state),
  }),
  // mapDispatchToProps
  {}
)(MissionOverviewPanelToolbar);
