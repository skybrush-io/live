import config from 'config';

import Dialog from '@mui/material/Dialog';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Tab from '@mui/material/Tab';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import DialogTabs from '@skybrush/mui-components/lib/DialogTabs';

import { loadShowFromUrl } from '~/features/show/actions';
import { closeLoadShowFromCloudDialog } from '~/features/show/slice';

/**
 * Presentation component for the dialog that allows the user to load a show
 * file from a remote data source such as his/her Skybrush Account or a git
 * repository
 */
const LoadShowFromCloudDialog = ({
  open = false,
  onClose,
  onLoadShowFromUrl,
}) => {
  return (
    <Dialog fullWidth open={open} onClose={onClose}>
      <DialogTabs value='skybrushAccount'>
        <Tab value='skybrushAccount' label='Skybrush Account' />
        <Tab disabled value='web' label='Web Link' />
        <Tab disabled value='git' label='Git Repository' />
      </DialogTabs>
      <List>
        <ListSubheader>Shared with me</ListSubheader>
        {config.examples.shows.map(({ id, title, url }) => (
          <ListItemButton key={id} onClick={() => onLoadShowFromUrl(url)}>
            <ListItemText primary={title} />
          </ListItemButton>
        ))}
      </List>
    </Dialog>
  );
};

LoadShowFromCloudDialog.propTypes = {
  onClose: PropTypes.func,
  onLoadShowFromUrl: PropTypes.func,
  open: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.show.loadShowFromCloudDialog,
  }),

  // mapDispatchToProps
  (dispatch) => ({
    onClose() {
      dispatch(closeLoadShowFromCloudDialog());
    },

    onLoadShowFromUrl(url) {
      dispatch(closeLoadShowFromCloudDialog());
      dispatch(loadShowFromUrl(url));
    },
  })
)(LoadShowFromCloudDialog);
