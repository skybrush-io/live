import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import BusinessCenter from '@material-ui/icons/BusinessCenter';

import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import GenericHeaderButton from './GenericHeaderButton';

import SidebarBadge from '../badges/SidebarBadge';

import Colors from '~/components/colors';
import { getActiveUAVIdsBeingAveraged } from '~/features/measurement/selectors';
import { showAveragingDialog } from '~/features/measurement/slice';
import { showRTKSetupDialog } from '~/features/rtk/slice';

const ToolboxButtonPresentation = ({
  numberOfAveragingInProgress,
  showAveragingDialog,
  showRTKSetupDialog,
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
        <MenuItem disabled>Firmware update</MenuItem>
        <MenuItem onClick={createClickListener(showRTKSetupDialog)}>
          RTK status
        </MenuItem>
        <MenuItem disabled>Version check</MenuItem>
      </Menu>
    </>
  );
};

ToolboxButtonPresentation.propTypes = {
  ...GenericHeaderButton.propTypes,
  numberOfAveragingInProgress: PropTypes.number,
  showAveragingDialog: PropTypes.func,
  showRTKSetupDialog: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    numberOfAveragingInProgress: getActiveUAVIdsBeingAveraged(state).length,
  }),
  // mapDispatchToProps
  {
    showAveragingDialog,
    showRTKSetupDialog,
  }
)(ToolboxButtonPresentation);
