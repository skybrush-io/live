import Functions from '@mui/icons-material/Functions';
import HelpOutline from '@mui/icons-material/HelpOutline';
import VpnKey from '@mui/icons-material/VpnKey';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu, { type MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { showConsistencyCheckDialog } from '~/features/consistency-check/actions';
import { CONSISTENCY_CHECK_JOB_TYPE as PARAMETER_CONSISTENCY_CHECK_JOB_TYPE } from '~/features/consistency-check/constants';
import { showFirmwareUpdateDialog } from '~/features/firmware-update/actions';
import { JOB_TYPE as FIRMWARE_UPLOAD_JOB_TYPE } from '~/features/firmware-update/constants';
import { showLicenseInfoDialog } from '~/features/license-info/slice';
import { showMapCachingDialog } from '~/features/map-caching/slice';
import { getActiveUAVIdsBeingAveraged } from '~/features/measurement/selectors';
import { showAveragingDialog } from '~/features/measurement/slice';
import { showParameterUploadDialog } from '~/features/parameters/actions';
import { UPLOAD_JOB_TYPE as PARAMETER_UPLOAD_JOB_TYPE } from '~/features/parameters/constants';
import { isConnected } from '~/features/servers/selectors';
import { isDeveloperModeEnabled } from '~/features/session/selectors';
import { showVersionCheckDialog } from '~/features/version-check/slice';
import MapCloudOff from '~/icons/MapCloudOff';
import Pro from '~/icons/Pro';
import type { RootState } from '~/store/reducers';

import { isHelpAvailable, showHelp } from '~/utils/help';
import JobRelatedMenuItem from './JobRelatedMenuItem';
import ToolboxDevMenuItems from './ToolboxDevMenuItems';

type ToolboxMenuPresentationProps = Readonly<{
  devMode: boolean;
  isConnected: boolean;
  numberOfAveragingInProgress: number;
  requestClose: () => void;
  showConsistencyCheckDialog: () => void;
  showAveragingDialog: () => void;
  showFirmwareUpdateDialog: () => void;
  showLicenseInfoDialog: () => void;
  showMapCachingDialog: () => void;
  showParameterUploadDialog: () => void;
  showVersionCheckDialog: () => void;
}> &
  MenuProps;

const ToolboxMenuPresentation = ({
  devMode,
  isConnected,
  numberOfAveragingInProgress,
  showConsistencyCheckDialog,
  showAveragingDialog,
  showFirmwareUpdateDialog,
  showLicenseInfoDialog,
  showMapCachingDialog,
  showParameterUploadDialog,
  showVersionCheckDialog: _showVersionCheckDialog,
  requestClose,
  ...rest
}: ToolboxMenuPresentationProps): React.JSX.Element => {
  const { t } = useTranslation();

  const createClickListener = (func: () => void) => (): void => {
    requestClose();
    func();
  };

  return (
    <Menu {...rest}>
      <MenuItem onClick={createClickListener(showAveragingDialog)}>
        <ListItemIcon>
          <Functions />
        </ListItemIcon>
        <ListItemText
          primary={t('toolbox.coordinateAveraging')}
          secondary={
            numberOfAveragingInProgress > 0
              ? t('toolbox.averagingInProgress', {
                  number: numberOfAveragingInProgress,
                })
              : undefined
          }
        />
      </MenuItem>
      <MenuItem onClick={createClickListener(showMapCachingDialog)}>
        <ListItemIcon>
          <MapCloudOff />
        </ListItemIcon>
        <ListItemText
          primary={
            <>
              {t('toolbox.offlineMaps')}
              <Pro style={{ verticalAlign: 'middle', marginLeft: 8 }} />
            </>
          }
        />
      </MenuItem>
      <Divider />
      <JobRelatedMenuItem
        onClick={createClickListener(showFirmwareUpdateDialog)}
        title={t('toolbox.firmwareUpdate')}
        jobType={FIRMWARE_UPLOAD_JOB_TYPE}
        pro
      />
      <JobRelatedMenuItem
        onClick={createClickListener(showConsistencyCheckDialog)}
        title={t('toolbox.paramCheck')}
        jobType={PARAMETER_CONSISTENCY_CHECK_JOB_TYPE}
      />
      <JobRelatedMenuItem
        onClick={createClickListener(showParameterUploadDialog)}
        title={t('toolbox.paramUpload')}
        jobType={PARAMETER_UPLOAD_JOB_TYPE}
      />
      <Divider />
      <MenuItem
        disabled={!isConnected}
        onClick={createClickListener(showLicenseInfoDialog)}
      >
        <ListItemIcon>
          <VpnKey />
        </ListItemIcon>
        <ListItemText primary={t('toolbox.licenseInfo')} />
      </MenuItem>
      {isHelpAvailable && (
        <MenuItem onClick={createClickListener(showHelp)}>
          <ListItemIcon>
            <HelpOutline />
          </ListItemIcon>
          <ListItemText primary={t('help')} />
        </MenuItem>
      )}
      {/*
        <MenuItem onClick={createClickListener(showVersionCheckDialog)}>
          Version check
        </MenuItem>
        */}
      {devMode && (
        <ToolboxDevMenuItems createClickListener={createClickListener} />
      )}
    </Menu>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    devMode: isDeveloperModeEnabled(state),
    isConnected: isConnected(state),
    numberOfAveragingInProgress: getActiveUAVIdsBeingAveraged(state).length,
  }),
  // mapDispatchToProps
  {
    showConsistencyCheckDialog,
    showAveragingDialog,
    showFirmwareUpdateDialog,
    showLicenseInfoDialog,
    showMapCachingDialog,
    showParameterUploadDialog,
    showVersionCheckDialog,
  }
)(ToolboxMenuPresentation);
