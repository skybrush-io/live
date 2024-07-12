import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Divider from '@material-ui/core/Divider';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import Build from '@material-ui/icons/Build';
import BusinessCenter from '@material-ui/icons/BusinessCenter';
import Functions from '@material-ui/icons/Functions';
import MapCloudOff from '~/icons/MapCloudOff';
import Tune from '@material-ui/icons/Tune';
import VpnKey from '@material-ui/icons/VpnKey';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import SidebarBadge from '@skybrush/mui-components/lib/SidebarBadge';

import Colors from '~/components/colors';
import { showFirmwareUpdateDialog } from '~/features/firmware-update/actions';
import { JOB_TYPE as FIRMWARE_UPLOAD_JOB_TYPE } from '~/features/firmware-update/constants';
import { showLicenseInfoDialog } from '~/features/license-info/slice';
import { showMapCachingDialog } from '~/features/map-caching/slice';
import { getActiveUAVIdsBeingAveraged } from '~/features/measurement/selectors';
import { showAveragingDialog } from '~/features/measurement/slice';
import { showParameterUploadDialog } from '~/features/parameters/actions';
import { JOB_TYPE as PARAMETER_UPLOAD_JOB_TYPE } from '~/features/parameters/constants';
import { isConnected } from '~/features/servers/selectors';
import { getRunningUploadJobType } from '~/features/upload/selectors';
import { showVersionCheckDialog } from '~/features/version-check/slice';

const ToolboxButtonPresentation = ({
  isConnected,
  numberOfAveragingInProgress,
  runningUploadJobType,
  showAveragingDialog,
  showFirmwareUpdateDialog,
  showLicenseInfoDialog,
  showMapCachingDialog,
  showParameterUploadDialog,
  t,
}) => {
  const [anchorElement, setAnchorElement] = useState(null);

  const handleClick = (event) => {
    setAnchorElement(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorElement(null);
  };

  const createClickListener = (func) => () => {
    handleClose();
    func();
  };

  const needsBadge = numberOfAveragingInProgress > 0;

  return (
    <>
      <GenericHeaderButton
        aria-controls='toolbox-menu'
        aria-haspopup='true'
        tooltip={t('toolbox.tooltip')}
        onClick={handleClick}
      >
        <SidebarBadge color={Colors.warning} visible={needsBadge} />
        <BusinessCenter />
      </GenericHeaderButton>
      <Menu
        id='toolbox-menu'
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        onClose={handleClose}
      >
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
            primary={t('toolbox.firmwareUpdate')}
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
          <ListItemText primary={t('toolbox.offlineMaps')} />
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
      </Menu>
    </>
  );
};

ToolboxButtonPresentation.propTypes = {
  ...GenericHeaderButton.propTypes,
  isConnected: PropTypes.bool,
  numberOfAveragingInProgress: PropTypes.number,
  runningUploadJobType: PropTypes.string,
  showAveragingDialog: PropTypes.func,
  showFirmwareUpdateDialog: PropTypes.func,
  showMapCachingDialog: PropTypes.func,
  showParameterUploadDialog: PropTypes.func,
  showLicenseInfoDialog: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
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
)(withTranslation()(ToolboxButtonPresentation));
