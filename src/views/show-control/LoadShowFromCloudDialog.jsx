import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Dialog from '@material-ui/core/Dialog';
import List from '@material-ui/core/List';
import ListSubheader from '@material-ui/core/ListSubheader';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Tab from '@material-ui/core/Tab';

import DialogTabs from '~/components/dialogs/DialogTabs';
import { loadExampleShow } from '~/features/show/actions';
import { closeLoadShowFromCloudDialog } from '~/features/show/slice';

/**
 * Presentation component for the dialog that allows the user to load a show
 * file from a remote data source such as his/her Skybrush Account or a git
 * repository
 */
const LoadShowFromCloudDialog = ({ open, onClose, onLoadExampleShow }) => {
  return (
    <Dialog fullWidth open={open} onClose={onClose}>
      <DialogTabs value="skybrushAccount">
        <Tab value="skybrushAccount" label="Skybrush Account" />
        <Tab disabled value="web" label="Web Link" />
        <Tab disabled value="git" label="Git Repository" />
      </DialogTabs>
      <List>
        <ListSubheader>Shared with me</ListSubheader>
        <ListItem button onClick={onLoadExampleShow}>
          <ListItemText primary="Example show with 40 drones" />
        </ListItem>
      </List>
    </Dialog>
  );
};

LoadShowFromCloudDialog.propTypes = {
  onClose: PropTypes.func,
  onLoadExampleShow: PropTypes.func,
  open: PropTypes.bool
};

LoadShowFromCloudDialog.defaultProps = {
  open: false
};

export default connect(
  // mapStateToProps
  state => ({
    ...state.show.loadShowFromCloudDialog
  }),

  // mapDispatchToProps
  dispatch => ({
    onClose() {
      dispatch(closeLoadShowFromCloudDialog());
    },

    onLoadExampleShow() {
      dispatch(closeLoadShowFromCloudDialog());
      dispatch(loadExampleShow());
    }
  })
)(LoadShowFromCloudDialog);
