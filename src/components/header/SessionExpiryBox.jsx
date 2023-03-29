import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import Box from '@material-ui/core/Box';

const headingFormatter = (_value, _unit, suffix) =>
  suffix === 'ago' ? 'Session expired' : 'Session expires';

const SessionExpiryBox = ({ expiresAt }) =>
  expiresAt ? (
    <Box
      alignSelf='center'
      px={1}
      style={{ color: 'white', fontSize: '0.875rem', textAlign: 'right' }}
    >
      <div style={{ color: 'rgba(255, 255, 255, 0.54)' }}>
        <TimeAgo date={expiresAt} formatter={headingFormatter} />
      </div>
      <div>
        <b>
          <TimeAgo date={expiresAt} />
        </b>
      </div>
    </Box>
  ) : null;

SessionExpiryBox.propTypes = {
  expiresAt: PropTypes.number,
};

export default connect(
  // mapStateToProps
  (state) => ({
    expiresAt: state.session.expiresAt,
  })
)(SessionExpiryBox);
