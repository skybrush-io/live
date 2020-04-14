import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';

import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import ArrowDropDown from '@material-ui/icons/ArrowDropDown';
import CloudUpload from '@material-ui/icons/CloudUpload';

const options = Object.freeze({
  byId: {
    all: {
      id: 'all',
      buttonLabel: 'Start upload',
      label: 'All drones',
    },

    selected: {
      id: 'selected',
      buttonLabel: 'Start upload to selected drones',
      disabled: ({ hasSelection }) => !hasSelection,
      label: 'Selected drones only',
    },
  },

  order: ['all', 'selected'],
});

/**
 * Presentation component for the button that allows the user to start the
 * upload for all drones or selected drones only.
 */
const StartUploadButton = ({
  disabled,
  hasSelection,
  onChangeUploadTarget,
  uploadTarget,
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleToggle = () => {
    setOpen((previousOpen) => !previousOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  const handleMenuItemClick = (value) => {
    onChangeUploadTarget(value);
    setOpen(false);
  };

  const selectedOption = options.byId[uploadTarget] || {};

  return (
    <>
      <ButtonGroup
        ref={anchorRef}
        disabled={
          disabled ||
          (selectedOption.disabled && selectedOption.disabled({ hasSelection }))
        }
        variant='contained'
        color='primary'
        aria-label='split button'
      >
        <Button startIcon={<CloudUpload />} {...rest}>
          {selectedOption.buttonLabel || 'Start upload'}
        </Button>
        <Button
          size='small'
          aria-controls={open ? 'split-button-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label='select upload set'
          aria-haspopup='menu'
          onClick={handleToggle}
        >
          <ArrowDropDown />
        </Button>
      </ButtonGroup>

      <Popper
        transition
        disablePortal
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id='split-button-menu'>
                  {options.order.map((id) => (
                    <MenuItem
                      key={id}
                      disabled={
                        options.byId[id].disabled
                          ? options.byId[id].disabled({ hasSelection })
                          : false
                      }
                      selected={uploadTarget === id}
                      onClick={() => handleMenuItemClick(id)}
                    >
                      {options.byId[id].label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
};

StartUploadButton.propTypes = {
  disabled: PropTypes.bool,
  hasSelection: PropTypes.bool,
  onChangeUploadTarget: PropTypes.func,
  uploadTarget: PropTypes.oneOf(options.order),
};

export default StartUploadButton;
