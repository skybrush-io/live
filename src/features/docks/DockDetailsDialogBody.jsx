import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import {
  getSelectedTabInDockDetailsDialog,
  getSelectedDockIdInDockDetailsDialog,
} from './details';

const DockDetailsDialogBody = ({ selectedTab, dockId }) => {
  switch (selectedTab) {
    case 'sensors':
      return (
        <List>
          <ListItem button>
            <StatusLight status='warning' />
            <ListItemText primary='Door sensor (left side) open' />
          </ListItem>
          <ListItem button>
            <StatusLight status='warning' />
            <ListItemText primary='Door sensor (right side) open' />
          </ListItem>
          <ListItem button>
            <StatusLight status='warning' />
            <ListItemText primary='Door sensor (back) open' />
          </ListItem>
          <ListItem button>
            <StatusLight status='success' />
            <ListItemText primary='Landing pad is at the bottom' />
          </ListItem>
          <ListItem button>
            <StatusLight status='success' />
            <ListItemText primary='Tweezer (left side) touching drone leg' />
          </ListItem>
          <ListItem button>
            <StatusLight status='success' />
            <ListItemText primary='Tweezer (right side) touching drone leg' />
          </ListItem>
          <ListItem button>
            <StatusLight status='warning' />
            <ListItemText primary='Tilt angle: 2.6°' />
          </ListItem>
        </List>
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
  selectedTab: PropTypes.oneOf([
    'landingPads',
    'sensors',
    'schedule',
    'liveCam',
  ]),
  uavId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    selectedTab: getSelectedTabInDockDetailsDialog(state),
    uavId: getSelectedDockIdInDockDetailsDialog(state),
  })
)(DockDetailsDialogBody);
