import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useToggle } from 'react-use';

import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import Switch from '@material-ui/core/Switch';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';

import MeetingRoom from '@material-ui/icons/MeetingRoom';
import NoMeetingRoom from '@material-ui/icons/NoMeetingRoom';
import PowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import Refresh from '@material-ui/icons/Refresh';

import StatusText from '@skybrush/mui-components/lib/StatusText';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import { ComplexAvatar } from '~/components/avatar';
import Colors from '~/components/colors';
import MiniTable from '~/components/MiniTable';

import { getSelectedDockIdInDockDetailsDialog } from './details';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      padding: theme.spacing(2),
      minWidth: 185,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },

    avatar: {
      display: 'flex',
      flexDirection: 'column',
    },

    summary: {
      paddingLeft: theme.spacing(2),
    },

    toolbar: {
      justifyContent: 'center',
      padding: theme.spacing(1, 0),
    },
    toolbarInner: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      maxWidth: 144 /* 20px for the icon, 8px for the padding around the icons, four icons per row */,
      '& > button': {
        padding: 8,
      },
    },
  }),
  {
    name: 'DockDetailsDialogSidebar',
  }
);

/**
 * Sidebar of the UAV details dialog.
 */
const DockDetailsDialogSidebar = ({ dockId }) => {
  const [modeIsAuto, toggleMode] = useToggle(false);
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Box display='flex' flexDirection='row' alignItems='center'>
        <Box className={classes.avatar}>
          <ComplexAvatar label='OK' status='success' />
        </Box>
        <Box className={classes.summary}>
          <Typography variant='body1'>{dockId}</Typography>
          {modeIsAuto ? (
            <StatusText key='status' status='success'>
              Automatic mode
            </StatusText>
          ) : (
            <StatusText key='status' status='warning'>
              Manual mode
            </StatusText>
          )}
        </Box>
      </Box>
      <Toolbar disableGutters variant='dense' className={classes.toolbar}>
        <Box className={classes.toolbarInner}>
          <Tooltip content='Open door'>
            <IconButton size='small'>
              <MeetingRoom fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip content='Close door'>
            <IconButton size='small'>
              <NoMeetingRoom fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip content='Reboot'>
            <IconButton size='small'>
              <Refresh htmlColor={Colors.error} fontSize='small' />
            </IconButton>
          </Tooltip>
          <Tooltip content='Power off'>
            <IconButton size='small'>
              <PowerSettingsNew htmlColor={Colors.error} fontSize='small' />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      <MiniTable
        items={[
          ['Location', 'ELTE kert'],
          'sep1',
          ['Latitude', 47.474223],
          ['Longitude', 19.06188],
          'sep2',
          ['Door', <StatusText status='success'>closed</StatusText>],
          ['Temperature', '31.3 °C'],
          'sep3',
          ['Landing pad 1', <StatusText status='next'>charging</StatusText>],
        ]}
      />
      <Box flex={1} />
      <FormControlLabel
        control={<Switch color='primary' />}
        label='Automatic mode'
        style={{ margin: '0 !important' }}
        checked={modeIsAuto}
        onChange={() => toggleMode()}
      />
    </Box>
  );
};

DockDetailsDialogSidebar.propTypes = {
  dockId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    dockId: getSelectedDockIdInDockDetailsDialog(state),
  }),
  // mapDispatchToProps
  {}
)(DockDetailsDialogSidebar);
