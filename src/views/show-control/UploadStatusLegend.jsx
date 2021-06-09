import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { Status } from '~/components/semantics';
import { getUploadStatusCodeCounters } from '~/features/show/selectors';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    justifyContent: 'space-around',
  },

  item: {
    display: 'flex',
    alignItems: 'center',

    '& span.counter': {
      margin: theme.spacing(0, 0.5, 0, 1),
    },

    '& span.label': {
      opacity: 0.5,
    },
  },
}));

const UploadStatusLegend = ({ failed, finished, inProgress, waiting }) => {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <Box className={classes.item}>
        <StatusLight inline status={Status.INFO} />
        <span className='counter'>{waiting}</span>
        <span className='label'>waiting</span>
      </Box>

      <Box className={classes.item}>
        <StatusLight inline status={Status.WARNING} />
        <span className='counter'>{inProgress}</span>
        <span className='label'>in progress</span>
      </Box>

      <Box className={classes.item}>
        <StatusLight inline status={Status.SUCCESS} />
        <span className='counter'>{finished}</span>
        <span className='label'>successful</span>
      </Box>

      <Box className={classes.item}>
        <StatusLight inline status={Status.ERROR} />
        <span className='counter'>{failed}</span>
        <span className='label'>failed</span>
      </Box>
    </Box>
  );
};

UploadStatusLegend.propTypes = {
  failed: PropTypes.number,
  finished: PropTypes.number,
  inProgress: PropTypes.number,
  waiting: PropTypes.number,
};

export default connect(
  // mapStateToProps
  getUploadStatusCodeCounters,
  // mapDispatchToProps
  {}
)(UploadStatusLegend);
