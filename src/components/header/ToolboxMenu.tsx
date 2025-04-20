import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Divider from '@material-ui/core/Divider';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu, { type MenuProps } from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import Build from '@material-ui/icons/Build';
import Functions from '@material-ui/icons/Functions';
import MapCloudOff from '~/icons/MapCloudOff';
import Pro from '~/icons/Pro';
import Tune from '@material-ui/icons/Tune';
import VpnKey from '@material-ui/icons/VpnKey';

import { showFirmwareUpdateDialog } from '~/features/firmware-update/actions';
import { JOB_TYPE as FIRMWARE_UPLOAD_JOB_TYPE } from '~/features/firmware-update/constants';
import { showLicenseInfoDialog } from '~/features/license-info/slice';
import { showMapCachingDialog } from '~/features/map-caching/slice';
import { getActiveUAVIdsBeingAveraged } from '~/features/measurement/selectors';
import { showAveragingDialog } from '~/features/measurement/slice';
import { showParameterUploadDialog } from '~/features/parameters/actions';
import { JOB_TYPE as PARAMETER_UPLOAD_JOB_TYPE } from '~/features/parameters/constants';
import { isConnected } from '~/features/servers/selectors';
import { isDeveloperModeEnabled } from '~/features/session/selectors';
import { getRunningUploadJobType } from '~/features/upload/selectors';
import { showVersionCheckDialog } from '~/features/version-check/slice';
import type { RootState } from '~/store/reducers';

import ToolboxDevMenuItems from './ToolboxDevMenuItems';

const anchorOrigin: MenuProps['anchorOrigin'] = {
  vertical: 'bottom',
  horizontal: 'left',
};

type ToolboxMenuPresentationProps = Readonly<{
  devMode: boolean;
  isConnected: boolean;
  numberOfAveragingInProgress: number;
  runningUploadJobType?: string;
  requestClose: () => void;
  showAveragingDialog: () => void;
  showFirmwareUpdateDialog: () => void;
  showLicenseInfoDialog: () => void;
  showMapCachingDialog: () => void;
  showParameterUploadDialog: () => void;
  showVersionCheckDialog: () => void;
}> &
  Omit<MenuProps, 'anchorOrigin' | 'getContentAnchorEl'>;

const ToolboxMenuPresentation = ({
  devMode,
  isConnected,
  numberOfAveragingInProgress,
  runningUploadJobType,
  showAveragingDialog,
  showFirmwareUpdateDialog,
  showLicenseInfoDialog,
  showMapCachingDialog,
  showParameterUploadDialog,
  showVersionCheckDialog: _showVersionCheckDialog,
  requestClose,
  ...rest
}: ToolboxMenuPresentationProps): JSX.Element => {
  const { t } = useTranslation();

  const createClickListener = (func: () => void) => (): void => {
    requestClose();
    func();
  };

  return (
    <Menu {...rest} getContentAnchorEl={null} anchorOrigin={anchorOrigin}>
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
      <MenuItem onClick={createClickListener(showFirmwareUpdateDialog)}>
        <ListItemIcon>
          <Build />
        </ListItemIcon>
        <ListItemText
          primary={
            <>
              {t('toolbox.firmwareUpdate')}
              <Pro style={{ verticalAlign: 'middle', marginLeft: 8 }} />
            </>
          }
          secondary={
            runningUploadJobType === FIRMWARE_UPLOAD_JOB_TYPE &&
            t('toolbox.uploadInProgress')
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
      <MenuItem onClick={createClickListener(showParameterUploadDialog)}>
        <ListItemIcon>
          <Tune />
        </ListItemIcon>
        <ListItemText
          primary={t('toolbox.paramUpload')}
          secondary={
            runningUploadJobType === PARAMETER_UPLOAD_JOB_TYPE &&
            t('toolbox.uploadInProgress')
          }
        />
      </MenuItem>
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
    runningUploadJobType: getRunningUploadJobType(state),
  }),
  // mapDispatchToProps
  {
    showAveragingDialog,
    showFirmwareUpdateDialog,
    showLicenseInfoDialog,
    showMapCachingDialog,
    showParameterUploadDialog,
    showVersionCheckDialog,
  }
)(ToolboxMenuPresentation);
