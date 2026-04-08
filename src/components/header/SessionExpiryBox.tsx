import Box from '@mui/material/Box';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import type { RootState } from '~/store/reducers';

const headingFormatter = (_value: number, _unit: string, suffix: string) =>
  suffix === 'ago' ? 'Session expired' : 'Session expires';

type Props = {
  expiresAt?: number;
};

const SessionExpiryBox = ({ expiresAt }: Props) =>
  expiresAt ? (
    <Box
      style={{ color: 'white', fontSize: '0.875rem', textAlign: 'right' }}
      sx={{ alignSelf: 'center', px: 1 }}
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

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    expiresAt: state.session.expiresAt,
  })
)(SessionExpiryBox);
