import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import IconButton from '@material-ui/core/IconButton';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Sync from '@material-ui/icons/Sync';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import {
  getSelectedTabInDockDetailsDialog,
  getSelectedDockIdInDockDetailsDialog,
} from './details';

const DockDetailsDialogBody = ({ dockId, selectedTab }) => {
  switch (selectedTab) {
    case 'status':
      return (
        <List>
          <ListItem button>
            <StatusLight status='success' />
            <ListItemText primary='Door closed' />
          </ListItem>
          <ListItem button>
            <StatusLight status='success' />
            <ListItemText primary='Tilt angle: 0.7°' />
          </ListItem>

          <ListSubheader>Landing pad 1</ListSubheader>
          <ListItem button>
            <StatusLight status='success' />
            <ListItemText primary='Landing pad is at the bottom' />
          </ListItem>
          <ListItem button>
            <StatusLight status='success' />
            <ListItemText primary='Tweezers touching drone leg (left, right)' />
          </ListItem>
          <ListItem button>
            <StatusLight status='info' />
            <ListItemText
              primary='Drone is charging'
              secondary='11.6V • Time until full: 17m 12s'
            />
          </ListItem>
        </List>
      );

    case 'schedule':
      return (
        <List dense>
          <ListSubheader>Upcoming missions</ListSubheader>
          <ListItem>
            <StatusLight status='next' size='small' />
            <ListItemText
              primary='Takeoff + landing test'
              secondary='Scheduled: 2021-07-26 18:10 UTC'
            />
          </ListItem>
          <ListItem>
            <StatusLight status='off' size='small' />
            <ListItemText
              primary='Takeoff + landing test'
              secondary='Scheduled: 2021-07-26 19:10 UTC'
            />
          </ListItem>
          <ListSubheader>Past missions</ListSubheader>
          <ListItem>
            <StatusLight status='success' size='small' />
            <ListItemText
              primary='Takeoff + landing test'
              secondary='2021-07-26 17:10 UTC • 0m 57s'
            />
          </ListItem>
          <ListItem>
            <StatusLight status='success' size='small' />
            <ListItemText
              primary='Takeoff + landing test'
              secondary='2021-07-26 16:10 UTC • 0m 57s'
            />
          </ListItem>
          <ListItem>
            <StatusLight status='error' size='small' />
            <ListItemText
              primary='Takeoff + landing test'
              secondary='2021-07-26 15:10 UTC • Prearm checks failed'
            />
          </ListItem>
        </List>
      );

    case 'storage':
      return (
        <>
          <List>
            <ListItem>
              <StatusLight status='success' />
              <ListItemText
                primary='/dev/mmcblk0p1 • System'
                secondary='4.0 GB used • 9.8 GB free • 29%'
              />
            </ListItem>
            <ListItem>
              <StatusLight status='success' />
              <ListItemText
                primary='/dev/mmcblk0p5 • Data storage'
                secondary='0.5 GB used • 63.1 GB free • 0.8%'
              />
              <ListItemSecondaryAction>
                <IconButton>
                  <Sync />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </List>
          <List>
            <ListSubheader>Synchronization log</ListSubheader>
            <ListItem>
              <StatusLight status='info' />
              <ListItemText primary='Click on a sync button to start' />
            </ListItem>
          </List>
        </>
      );

    case 'liveCam':
      return (
        <video
          autoPlay
          loop
          muted
          poster='//cam.idokep.hu/cam/schonherz1/thumbnail.jpg'
          width='380'
          height='284'
        >
          <source src='//cam.idokep.hu/cam/schonherz1/animation.webm' />
          <source src='//cam.idokep.hu/cam/schonherz1/animation.mp4' />
          <img
            src='//cam.idokep.hu/cam/schonherz1/thumbnail.jpg'
            width='380'
            height='284'
            id='schonherz1'
          />
        </video>
      );
    default:
      return null;
  }
};

DockDetailsDialogBody.propTypes = {
  dockId: PropTypes.string,
  selectedTab: PropTypes.oneOf(['status', 'schedule', 'storage', 'liveCam']),
};

export default connect(
  // mapStateToProps
  (state) => ({
    dockId: getSelectedDockIdInDockDetailsDialog(state),
    selectedTab: getSelectedTabInDockDetailsDialog(state),
  })
)(DockDetailsDialogBody);
