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
import {
  getEstimatedMissionDistance,
  getEstimatedMissionDuration,
} from '~/features/mission/selectors';
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
  estimatedMissionDistance,
  estimatedMissionDuration,
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
          label={`Estimated route: ${formatDistance(estimatedMissionDistance)}`}
        />
        <ToolbarDivider orientation='vertical' />
        <Chip
          icon={<Timer />}
          size='small'
          variant='outlined'
          label={`Estimated time: ${formatDuration(estimatedMissionDuration)}`}
        />
      </Toolbar>
    </Paper>
  );
};

MissionOverviewPanelToolbar.propTypes = {
  estimatedMissionDuration: PropTypes.number,
  estimatedMissionDistance: PropTypes.number,
};

export default connect(
  // mapStateToProps
  (state) => ({
    estimatedMissionDistance: getEstimatedMissionDistance(state),
    estimatedMissionDuration: getEstimatedMissionDuration(state),
  }),
  // mapDispatchToProps
  {}
)(MissionOverviewPanelToolbar);
