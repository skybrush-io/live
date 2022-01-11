import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import BusinessCenter from '@material-ui/icons/BusinessCenter';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';
import SidebarBadge from '@skybrush/mui-components/lib/SidebarBadge';

import Colors from '~/components/colors';
import { showLicenseInfoDialog } from '~/features/license-info/slice';
import { getActiveUAVIdsBeingAveraged } from '~/features/measurement/selectors';
import { showAveragingDialog } from '~/features/measurement/slice';
import { showParameterUploadDialog } from '~/features/parameters/actions';
import { isConnected } from '~/features/servers/selectors';
import { isUploadInProgress } from '~/features/upload/selectors';
import { showVersionCheckDialog } from '~/features/version-check/slice';

const ToolboxButtonPresentation = ({
  isUploadInProgress,
  numberOfAveragingInProgress,
  showAveragingDialog,
  showLicenseInfoDialog,
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
        <MenuItem onClick={createClickListener(showParameterUploadDialog)}>
          <ListItemText
            primary='Parameter upload'
            secondary={isUploadInProgress ? 'Upload in progress' : undefined}
          />
        </MenuItem>
        <MenuItem onClick={createClickListener(showLicenseInfoDialog)}>
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
  isUploadInProgress: PropTypes.bool,
  numberOfAveragingInProgress: PropTypes.number,
  showAveragingDialog: PropTypes.func,
  showParameterUploadDialog: PropTypes.func,
  showLicenseInfoDialog: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isConnectedToServer: isConnected(state),
    isUploadInProgress: isUploadInProgress(state),
    numberOfAveragingInProgress: getActiveUAVIdsBeingAveraged(state).length,
  }),
  // mapDispatchToProps
  {
    showAveragingDialog,
    showLicenseInfoDialog,
    showParameterUploadDialog,
    showVersionCheckDialog,
  }
)(ToolboxButtonPresentation);
