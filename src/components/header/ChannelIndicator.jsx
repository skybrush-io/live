import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';

import { getPreferredCommunicationChannelIndex } from '~/features/mission/selectors';

const useStyles = makeStyles(() => ({
  root: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    color: 'white',
    width: 16,
    height: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
  },
}));

const ChannelIndicator = ({ channel }) => {
  const classes = useStyles();
  return <div className={classes.root}>{channel}</div>;
};

ChannelIndicator.propTypes = {
  channel: PropTypes.number.isRequired,
};

export default connect(
  (state) => ({
    channel: getPreferredCommunicationChannelIndex(state) + 1,
  })
)(ChannelIndicator);
