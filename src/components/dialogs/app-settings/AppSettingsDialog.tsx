import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Tab from '@mui/material/Tab';
import type { ReactElement, SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DialogTabs } from '@skybrush/mui-components';

import {
  closeAppSettingsDialog,
  setAppSettingsDialogTab,
} from '~/features/settings/actions';
import { AppSettingsDialogTab } from '~/features/settings/types';
import type { RootState } from '~/store/reducers';

import APIKeysTab from './APIKeysTab';
import DisplayTab from './DisplayTab';
import PreflightTab from './PreflightTab';
import ServerTab from './ServerTab';
import ThreeDViewTab from './ThreeDViewTab';
import UAVsTab from './UAVsTab';

/* ===================================================================== */

const tabNameToComponent: Record<AppSettingsDialogTab, ReactElement> = {
  apiKeys: <APIKeysTab />,
  display: <DisplayTab />,
  preflight: <PreflightTab />,
  server: <ServerTab />,
  threeD: <ThreeDViewTab />,
  uavs: <UAVsTab />,
};

type Props = {
  onClose: () => void;
  onTabSelected: (event: SyntheticEvent, value: AppSettingsDialogTab) => void;
  open?: boolean;
  selectedTab?: AppSettingsDialogTab;
};

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the app settings.
 */
const AppSettingsDialogPresentation = ({
  onClose,
  onTabSelected,
  open = false,
  selectedTab = AppSettingsDialogTab.DISPLAY,
}: Props) => {
  const { t } = useTranslation();

  return (
    <Dialog fullWidth open={open} maxWidth='sm' onClose={onClose}>
      <DialogTabs
        alignment='center'
        value={selectedTab}
        onChange={onTabSelected}
      >
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
};

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the server settings.
 */
const AppSettingsDialog = connect(
  // mapStateToProps
  (state: RootState) => state.dialogs.appSettings,
  // mapDispatchToProps
  (dispatch) => ({
    onClose() {
      dispatch(closeAppSettingsDialog());
    },
    onTabSelected(_event: SyntheticEvent, value: AppSettingsDialogTab) {
      dispatch(setAppSettingsDialogTab(value));
    },
  })
)(AppSettingsDialogPresentation);

export default AppSettingsDialog;
