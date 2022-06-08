import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import BusinessCenter from '@material-ui/icons/BusinessCenter';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import SidebarBadge from '@skybrush/mui-components/lib/SidebarBadge';

import Colors from '~/components/colors';
import { showLicenseInfoDialog } from '~/features/license-info/slice';
import { showMapCachingDialog } from '~/features/map-caching/slice';
import { getActiveUAVIdsBeingAveraged } from '~/features/measurement/selectors';
import { showAveragingDialog } from '~/features/measurement/slice';
import { showParameterUploadDialog } from '~/features/parameters/actions';
import { isConnected } from '~/features/servers/selectors';
import { isUploadInProgress } from '~/features/upload/selectors';
import { showVersionCheckDialog } from '~/features/version-check/slice';

const ToolboxButtonPresentation = ({
  isConnected,
  isUploadInProgress,
  numberOfAveragingInProgress,
  showAveragingDialog,
  showLicenseInfoDialog,
  showMapCachingDialog,
  showParameterUploadDialog,
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
        tooltip='Toolbox'
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
          <ListItemText
            primary='Coordinate averaging'
            secondary={
              numberOfAveragingInProgress > 0
                ? `${numberOfAveragingInProgress} in progress`
                : undefined
            }
          />
        </MenuItem>
        {/*
        <MenuItem disabled>Firmware update</MenuItem>
        */}
        <MenuItem onClick={createClickListener(showMapCachingDialog)}>
          <ListItemText primary='Offline maps' />
        </MenuItem>
        <MenuItem onClick={createClickListener(showParameterUploadDialog)}>
          <ListItemText
            primary='Parameter upload'
            secondary={isUploadInProgress ? 'Upload in progress' : undefined}
          />
        </MenuItem>
        <Divider />
        <MenuItem
          disabled={!isConnected}
          onClick={createClickListener(showLicenseInfoDialog)}
        >
          <ListItemText primary='License info' />
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
  isUploadInProgress: PropTypes.bool,
  numberOfAveragingInProgress: PropTypes.number,
  showAveragingDialog: PropTypes.func,
  showMapCachingDialog: PropTypes.func,
  showParameterUploadDialog: PropTypes.func,
  showLicenseInfoDialog: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isConnected: isConnected(state),
    isUploadInProgress: isUploadInProgress(state),
    numberOfAveragingInProgress: getActiveUAVIdsBeingAveraged(state).length,
  }),
  // mapDispatchToProps
  {
    showAveragingDialog,
    showLicenseInfoDialog,
    showMapCachingDialog,
    showParameterUploadDialog,
    showVersionCheckDialog,
  }
)(ToolboxButtonPresentation);
