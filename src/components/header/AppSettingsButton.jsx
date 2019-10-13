import SettingsIcon from '@material-ui/icons/Settings';

import React from 'react';
import { connect } from 'react-redux';

import GenericHeaderButton from './GenericHeaderButton';

import { toggleAppSettingsDialog } from '~/actions/app-settings';

const AppSettingsButtonPresentation = props => (
  <GenericHeaderButton {...props}>
    <SettingsIcon />
  </GenericHeaderButton>
);

AppSettingsButtonPresentation.propTypes = {
  ...GenericHeaderButton.propTypes
};

export default connect(
  // mapStateToProps
  () => ({}),
  // mapDispatchToProps
  dispatch => ({
    onClick() {
      dispatch(toggleAppSettingsDialog());
    }
  })
)(AppSettingsButtonPresentation);
