import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import SettingsIcon from '@material-ui/icons/Settings';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';

import { toggleAppSettingsDialog } from '~/features/settings/actions';

const AppSettingsButtonPresentation = (props) => (
  <Translation>
    {(t) => (
      <GenericHeaderButton {...props} tooltip={t('preferences')}>
        <SettingsIcon />
      </GenericHeaderButton>
    )}
  </Translation>
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
