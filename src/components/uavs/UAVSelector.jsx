/**
 * @file Component that allows the user to select a UAV from a dropdown list.
 */

import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';

import { PopoverWithContainerFromContext as Popover } from '~/containerContext';

import {
  getUAVIdList,
  getUAVIdsSortedByErrorCode,
} from '~/features/uavs/selectors';

import DroneAvatar from './DroneAvatar';

const useStyles = makeStyles(
  (theme) => ({
    content: {
      width:
        5 * 40 + // Five avatars
        6 * theme.spacing(1), // Paddings and gaps
      maxHeight:
        5 * 40 + // Five avatars
        6 * theme.spacing(1), // Paddings and gaps
      display: 'flex',
      flexWrap: 'wrap',
      padding: theme.spacing(1),
      gap: theme.spacing(1),

      overflow: 'overlay',
    },

    paper: {
      overflow: 'visible',

      '&::before': {
        content: '""',
        display: 'block',

        width: 16,
        height: 16,

        position: 'absolute',
        top: -8,
        left: 'calc(50% - 8px)',

        transform: 'rotate(45deg)',

        backgroundColor: theme.palette.background.paper,
      },
    },
  }),
  {
    name: 'UAVSelector',
  }
);

const UAVSelectorPresentation = ({
  anchorEl,
  onClose,
  onFocus,
  onSelect,
  open,
  uavIds,
}) => {
  const classes = useStyles();

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      PaperProps={{ className: classes.paper }}
      onClose={onClose}
      onFocus={onFocus}
    >
      <div className={classes.content} tabIndex={0}>
        {uavIds.map((uavId) => (
          // Enclose the Avatar in a `div`, as it renders a fragment
          <div key={uavId}>
            <DroneAvatar
              variant='minimal'
              id={uavId}
              AvatarProps={{
                style: { cursor: 'pointer' },
                onClick() {
                  onSelect(uavId);
                  onClose();
                },
              }}
            />
          </div>
        ))}
      </div>
    </Popover>
  );
};

UAVSelectorPresentation.propTypes = {
  anchorEl: PropTypes.object, // TODO: Find a more exact PropType for this!
  onClose: PropTypes.func,
  onFocus: PropTypes.func,
  onSelect: PropTypes.func,
  open: PropTypes.bool,
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

export const UAVSelectorPopover = connect(
  // mapStateToProps
  (state, { sortedByError }) => ({
    uavIds: sortedByError
      ? getUAVIdsSortedByErrorCode(state)
      : getUAVIdList(state),
  })
)(UAVSelectorPresentation);

/**
 * Wrapper component that provides a `handleClick` function for the children
 * components to be attached to the target that should trigger the selector
 */
export const UAVSelectorWrapper = ({ children, ...rest }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [focusRestorationTarget, setFocusRestorationTarget] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFocus = (event) => {
    if (event?.relatedTarget?.focusRestorationTarget) {
      setFocusRestorationTarget(event.relatedTarget.focusRestorationTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    if (focusRestorationTarget) {
      setTimeout(() => focusRestorationTarget.focus(), 0);
    }
  };

  return (
    <>
      {children(handleClick)}
      <UAVSelectorPopover
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onFocus={handleFocus}
        {...rest}
      />
    </>
  );
};

UAVSelectorWrapper.propTypes = {
  children: PropTypes.func,
  sortedByError: PropTypes.bool,
};
