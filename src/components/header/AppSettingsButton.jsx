import SettingsIcon from '@material-ui/icons/Settings';

import React from 'react';
import { connect } from 'react-redux';

import GenericHeaderButton from './GenericHeaderButton';

import { toggleAppSettingsDialog } from '~/actions/app-settings';

const AppSettingsButtonPresentation = (props) => (
  <GenericHeaderButton {...props} tooltip='Preferences'>
    <SettingsIcon />
  </GenericHeaderButton>
);

AppSettingsButtonPresentation.propTypes = {
  ...GenericHeaderButton.propTypes,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onClick: toggleAppSettingsDialog,
  }
)(AppSettingsButtonPresentation);
