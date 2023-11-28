import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Tab from '@material-ui/core/Tab';

import DialogTabs from '@skybrush/mui-components/lib/DialogTabs';

import {
  closeAppSettingsDialog,
  setAppSettingsDialogTab,
} from '~/features/settings/actions';

import APIKeysTab from './APIKeysTab';
import DisplayTab from './DisplayTab';
import PreflightTab from './PreflightTab';
import ServerTab from './ServerTab';
import ThreeDViewTab from './ThreeDViewTab';
import UAVsTab from './UAVsTab';

/* ===================================================================== */

const tabNameToComponent = {
  apiKeys: <APIKeysTab />,
  display: <DisplayTab />,
  preflight: <PreflightTab />,
  server: <ServerTab />,
  threeD: <ThreeDViewTab />,
  uavs: <UAVsTab />,
};

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the app settings.
 */
const AppSettingsDialogPresentation = ({
  onClose,
  onTabSelected,
  open,
  selectedTab,
  t,
}) => (
  <Dialog fullWidth open={open} maxWidth='sm' onClose={onClose}>
    <DialogTabs alignment='center' value={selectedTab} onChange={onTabSelected}>
      <Tab value='display' label={t('settings.tabs.display')} />
      <Tab value='threeD' label={t('settings.tabs.threeDView')} />
      <Tab value='uavs' label={t('settings.tabs.uavs')} />
      <Tab value='preflight' label={t('settings.tabs.preflight')} />
      {window.bridge && window.bridge.isElectron ? (
        <Tab value='server' label={t('settings.tabs.server')} />
      ) : null}
      <Tab value='apiKeys' label={t('settings.tabs.apiKeys')} />
    </DialogTabs>
    <DialogContent style={{ minHeight: 200 }}>
      {tabNameToComponent[selectedTab]}
    </DialogContent>
  </Dialog>
);

AppSettingsDialogPresentation.propTypes = {
  onClose: PropTypes.func,
  onTabSelected: PropTypes.func,
  open: PropTypes.bool,
  selectedTab: PropTypes.string,
  t: PropTypes.func,
};

AppSettingsDialogPresentation.defaultProps = {
  open: false,
  selectedTab: 'auto',
};

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the server settings.
 */
const AppSettingsDialog = connect(
  // mapStateToProps
  (state) => state.dialogs.appSettings,
  // mapDispatchToProps
  (dispatch) => ({
    onClose() {
      dispatch(closeAppSettingsDialog());
    },
    onTabSelected(event, value) {
      dispatch(setAppSettingsDialogTab(value));
    },
  })
)(withTranslation()(AppSettingsDialogPresentation));

export default AppSettingsDialog;
