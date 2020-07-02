import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import BusinessCenter from '@material-ui/icons/BusinessCenter';

import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import GenericHeaderButton from './GenericHeaderButton';

import { showAveragingDialog } from '~/features/measurement/slice';

const ToolboxButtonPresentation = ({ showAveragingDialog }) => {
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

  return (
    <>
      <GenericHeaderButton
        aria-controls='toolbox-menu'
        aria-haspopup='true'
        tooltip='Toolbox'
        onClick={handleClick}
      >
        <BusinessCenter />
      </GenericHeaderButton>
      <Menu
        id='toolbox-menu'
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        onClose={handleClose}
      >
        <MenuItem onClick={createClickListener(showAveragingDialog)}>
          Coordinate averaging
        </MenuItem>
        <MenuItem disabled>Firmware update</MenuItem>
        <MenuItem disabled>RTK status</MenuItem>
        <MenuItem disabled>Version check</MenuItem>
      </Menu>
    </>
  );
};

ToolboxButtonPresentation.propTypes = {
  ...GenericHeaderButton.propTypes,
  showAveragingDialog: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    showAveragingDialog,
  }
)(ToolboxButtonPresentation);
