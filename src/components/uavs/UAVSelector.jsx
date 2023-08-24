/**
 * @file Component that allows the user to select a UAV from a dropdown list.
 */

import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';
import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import { PopoverWithContainerFromContext as Popover } from '~/containerContext';

import { getReverseMissionMapping } from '~/features/mission/selectors';
import {
  getUAVIdList,
  getUAVIdsSortedByErrorCode,
} from '~/features/uavs/selectors';
import { formatMissionId } from '~/utils/formatting';

import DroneAvatar from './DroneAvatar';

const SCROLLBAR_WIDTH = 10;

const useStyles = makeStyles(
  (theme) => ({
    content: {
      // HACK: Push the scrollbar to the outer edge of the popup
      marginRight: -SCROLLBAR_WIDTH,

      width:
        5 * 40 + // Five avatars
        6 * theme.spacing(1) + // Paddings and gaps
        SCROLLBAR_WIDTH,
      maxHeight:
        5 * 40 + // Five avatars
        6 * theme.spacing(1), // Paddings and gaps

      padding: theme.spacing(1),

      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(1),

      overflow: 'hidden auto',
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
  filterable,
  onClose,
  onFocus,
  onSelect,
  open,
  reverseMissionMapping,
  uavIds,
}) => {
  const classes = useStyles();

  const [filter, setFilter] = useState('');

  // Clear the filter each time the popover is opened.
  useEffect(() => {
    if (open) {
      setFilter('');
    }
  }, [open]);

  const filtered = uavIds.filter(
    (uavId) =>
      uavId.startsWith(filter) ||
      (uavId in reverseMissionMapping &&
        formatMissionId(reverseMissionMapping[uavId]).startsWith(filter))
  );

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'Enter': {
        if (filtered.length > 0) {
          onSelect(filtered[0]);
          onClose();
          event.stopPropagation();
          event.preventDefault();
        }

        break;
      }

      case 'Backspace': {
        setFilter(filter.slice(0, -1));

        break;
      }

      case 's': {
        if (filter.startsWith('s')) {
          setFilter(filter.slice(1));
        } else {
          setFilter('s' + filter);
        }

        event.stopPropagation();

        break;
      }

      default: {
        if (/^\d$/.test(event.key)) {
          setFilter(filter + event.key);
          event.stopPropagation();
        }
      }
    }
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      PaperProps={{
        className: classes.paper,
        onKeyDown: filterable ? handleKeyDown : undefined,
      }}
      onClose={onClose}
      onFocus={onFocus}
    >
      <div className={classes.content} tabIndex={0}>
        {filtered.length > 0 ? (
          filtered.map((uavId) => (
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
          ))
        ) : (
          <BackgroundHint text={`No matching UAVs for: "${filter}"`} />
        )}
      </div>
    </Popover>
  );
};

UAVSelectorPresentation.propTypes = {
  anchorEl: PropTypes.object, // TODO: Find a more exact PropType for this!
  filterable: PropTypes.bool,
  onClose: PropTypes.func,
  onFocus: PropTypes.func,
  onSelect: PropTypes.func,
  open: PropTypes.bool,
  reverseMissionMapping: PropTypes.object,
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

export const UAVSelectorPopover = connect(
  // mapStateToProps
  (state, { sortedByError }) => ({
    reverseMissionMapping: getReverseMissionMapping(state),
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
