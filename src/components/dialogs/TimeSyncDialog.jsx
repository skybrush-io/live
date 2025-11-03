import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Typography from '@mui/material/Typography';
import clsx from 'clsx';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import {
  DraggableDialog,
  SmallProgressIndicator,
} from '@skybrush/mui-components';

import AutoUpdatingTimestamp from '~/components/AutoUpdatingTimestamp';
import Colors from '~/components/colors';
import {
  adjustServerTimeToMatchLocalTime,
  calculateAndStoreClockSkewWithMinDelay,
} from '~/features/servers/actions';
import {
  getClockSkewInMilliseconds,
  isAdjustingServerTime,
  isCalculatingClockSkew,
  isClockSkewSignificant,
  isTimeSyncWarningDialogVisible,
} from '~/features/servers/selectors';
import { closeTimeSyncWarningDialog } from '~/features/servers/slice';
import messageHub from '~/message-hub';

const useStyles = makeStyles((theme) => ({
  content: {
    '& strong': {
      color: theme.palette.text.primary,
    },
  },

  card: {
    flex: 1,
    fontSize: '16px',
    margin: theme.spacing(0, 2),
  },

  cardLeft: {
    textAlign: 'right',
  },

  localTime: {
    color: Colors.info,
    fontWeight: 'bold',
  },

  serverTime: {
    color: Colors.warning,
    fontWeight: 'bold',
  },
}));

const ServerAndClientClockComparison = ({ clockSkew }) => {
  const classes = useStyles();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', mx: -2, mb: 2 }}>
      <Box className={clsx(classes.card, classes.cardLeft)}>
        <Typography gutterBottom color='textPrimary'>
          Time on this device
        </Typography>
        <AutoUpdatingTimestamp className={classes.localTime} component='div' />
      </Box>
      <Box variant='outlined' className={classes.card}>
        <Typography gutterBottom color='textPrimary'>
          Server time
        </Typography>
        {!isNil(clockSkew) ? (
          <AutoUpdatingTimestamp
            className={classes.serverTime}
            clockSkew={clockSkew}
            component='div'
          />
        ) : (
          <div className={classes.serverTime}>unknown</div>
        )}
      </Box>
    </Box>
  );
};

ServerAndClientClockComparison.propTypes = {
  clockSkew: PropTypes.number,
};

const TimeSyncDialogBodyWhenClocksAreInSync = ({ clockSkew }) => {
  const classes = useStyles();
  return (
    <DialogContent className={classes.content}>
      <DialogContentText>
        The internal clock of your device and the clock of the Skybrush server
        are now in sync:
      </DialogContentText>
      <ServerAndClientClockComparison clockSkew={clockSkew} />
    </DialogContent>
  );
};

TimeSyncDialogBodyWhenClocksAreInSync.propTypes = {
  clockSkew: PropTypes.number,
};

const TimeSyncDialogBodyWhenClocksAreNotInSync = ({ clockSkew }) => {
  const classes = useStyles();
  return (
    <DialogContent className={classes.content}>
      <Box sx={{ my: 2 }}>
        <Typography variant='h6'>Why am I seeing this warning?</Typography>
      </Box>
      <DialogContentText>
        The internal clock of your device and the clock of the Skybrush server
        you have connected to are not in sync:
      </DialogContentText>
      <ServerAndClientClockComparison clockSkew={clockSkew} />
      <DialogContentText>
        Scheduled actions (such as the coordinated start of a drone swarm at a
        given time) are performed according to the server clock. If the server
        clock is behind or ahead of wall clock time, these actions may happen
        too early or too late.{' '}
        <strong>
          It is your responsibility to ensure that the clock of the server is
          synchronized to UTC.
        </strong>
      </DialogContentText>
      <Box sx={{ my: 2 }}>
        <Typography variant='h6'>What should I do now?</Typography>
      </Box>
      <DialogContentText>
        Please check the timestamps reported above and decide which one is
        correct.
      </DialogContentText>
      <DialogContentText>
        <span className={classes.localTime}>If the local time is correct</span>,
        please click on the <strong>Adjust server time</strong> button below to
        adjust the server clock to match the time on this device.
      </DialogContentText>
      <DialogContentText>
        <span className={classes.serverTime}>
          If the server time is correct
        </span>
        , please update the time on this device and then click on the{' '}
        <strong>Check clock skew</strong> button to perform another measurement
        after the update.
      </DialogContentText>
    </DialogContent>
  );
};

TimeSyncDialogBodyWhenClocksAreNotInSync.propTypes = {
  clockSkew: PropTypes.number,
};

const TimeSyncDialog = ({
  clockSkew,
  isAdjustingServerTime,
  isCalculatingClockSkew,
  isClockSkewSignificant,
  onAdjustServerTime,
  onCalculateAndStoreClockSkew,
  onClose,
  open,
}) => (
  <DraggableDialog
    open={open}
    title={
      isClockSkewSignificant
        ? 'Clock skew detected between server and client'
        : 'Server and client clocks are in sync'
    }
  >
    {isCalculatingClockSkew && isNil(clockSkew) ? (
      <DialogContent>
        <Box align='center' sx={{ my: 4 }}>
          <Box>
            <CircularProgress />
          </Box>
          Please wait, estimating clock skew...
        </Box>
      </DialogContent>
    ) : isClockSkewSignificant ? (
      <TimeSyncDialogBodyWhenClocksAreNotInSync clockSkew={clockSkew} />
    ) : (
      <TimeSyncDialogBodyWhenClocksAreInSync clockSkew={clockSkew} />
    )}
    <DialogActions className='bottom-bar'>
      <SmallProgressIndicator
        label={
          isAdjustingServerTime
            ? 'Adjusting server time...'
            : 'Calculating clock skew...'
        }
        visible={isAdjustingServerTime || isCalculatingClockSkew}
        flex={1}
      />
      <Button
        disabled={
          isNil(clockSkew) || isCalculatingClockSkew || !isClockSkewSignificant
        }
        onClick={onAdjustServerTime}
      >
        Adjust server time
      </Button>
      <Button
        disabled={isCalculatingClockSkew}
        onClick={onCalculateAndStoreClockSkew}
      >
        Check clock skew
      </Button>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </DraggableDialog>
);

TimeSyncDialog.propTypes = {
  clockSkew: PropTypes.number,
  isAdjustingServerTime: PropTypes.bool,
  isCalculatingClockSkew: PropTypes.bool,
  isClockSkewSignificant: PropTypes.bool,
  onAdjustServerTime: PropTypes.func,
  onCalculateAndStoreClockSkew: PropTypes.func,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    clockSkew: getClockSkewInMilliseconds(state),
    isAdjustingServerTime: isAdjustingServerTime(state),
    isCalculatingClockSkew: isCalculatingClockSkew(state),
    isClockSkewSignificant: isClockSkewSignificant(state),
    open: isTimeSyncWarningDialogVisible(state),
  }),

  // mapDispatchToProps
  {
    onAdjustServerTime: () => adjustServerTimeToMatchLocalTime(messageHub),
    onCalculateAndStoreClockSkew: () =>
      calculateAndStoreClockSkewWithMinDelay(messageHub, {
        method: 'accurate',
      }),
    onClose: closeTimeSyncWarningDialog,
  }
)(TimeSyncDialog);
