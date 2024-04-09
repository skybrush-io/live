/**
 * @file Component that allows the user to select a UAV from a dropdown list.
 */

import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';
import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import { PopoverWithContainerFromContext as Popover } from '~/containerContext';

import {
  getMissionMapping,
  getReverseMissionMapping,
} from '~/features/mission/selectors';
import {
  getUAVIdList,
  getUAVIdsSortedByErrorCode,
} from '~/features/uavs/selectors';
import { formatMissionId } from '~/utils/formatting';

import DroneAvatar from './DroneAvatar';
import DronePlaceholder from './DronePlaceholder';

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

    paper: ({ openAbove }) => ({
      overflow: 'visible',

      '&::before': {
        content: '""',
        display: 'block',

        width: theme.spacing(2),
        height: theme.spacing(2),

        position: 'absolute',
        [openAbove ? 'bottom' : 'top']: -theme.spacing(1),
        left: ({ anchorCenter }) =>
          `calc(50% - ${theme.spacing(1)}px + ${
            // Adjust arrow position when the `Popover` is pushed against the
            // edge of the viewport, thus isn't centered on the anchor element
            (() => {
              const margin = theme.spacing(2);
              const width =
                5 * 40 + // Five avatars
                6 * theme.spacing(1); // Paddings and gaps
              const leftLimit = margin + width / 2;
              const rightLimit = window.innerWidth - leftLimit;

              // prettier-ignore
              return (
                anchorCenter < leftLimit ? anchorCenter - leftLimit :
                anchorCenter > rightLimit ? anchorCenter - rightLimit :
                0
              );
            })()
          }px)`,

        transform: 'rotate(45deg)',

        backgroundColor: theme.palette.background.paper,
      },
    }),
  }),
  {
    name: 'UAVSelector',
  }
);

const UAVSelector = ({
  anchorEl,
  filterable,
  onClose,
  onFocus,
  onSelect,
  open,
  sortedByError,
  useMissionIds,
}) => {
  const { t } = useTranslation();
  const uavIds = useSelector(
    sortedByError ? getUAVIdsSortedByErrorCode : getUAVIdList,
    { equalityFn: shallowEqual }
  );
  const reverseMissionMapping = useSelector(getReverseMissionMapping);
  const missionMapping = useSelector(getMissionMapping);

  const items = useMissionIds
    ? missionMapping.map((uavId, index) => ({ uavId, missionId: index }))
    : uavIds.map((uavId) => ({
        uavId,
        missionId: reverseMissionMapping[uavId],
      }));

  const { anchorCenter, openAbove } =
    useMemo(() => {
      if (!anchorEl) {
        return;
      }

      const { bottom, left, right } = anchorEl.getBoundingClientRect();
      return {
        // Get the horizontal center of the anchor to adjust the arrow location
        anchorCenter: (left + right) / 2,
        // Show the popup updwards if there isn't enough space below the anchor
        openAbove: window.innerHeight - bottom < 256, // Approximate `maxHeight`
      };
    }, [anchorEl]) ?? {};

  const classes = useStyles({ anchorCenter, openAbove });

  const [filter, setFilter] = useState('');

  // Clear the filter each time the popover is opened.
  useEffect(() => {
    if (open) {
      setFilter('');
    }
  }, [open]);

  const filtered = items.filter(
    ({ uavId, missionId }) =>
      uavId?.startsWith(filter) ||
      (missionId !== undefined && formatMissionId(missionId).startsWith(filter))
  );

  const handleKeyDown = (event) => {
    switch (event.key) {
      case 'Enter': {
        if (filtered.length > 0) {
          onSelect(filtered[0][useMissionIds ? 'missionId' : 'uavId']);
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

      // TODO: Generalize this, it could be `s` for "show" and `m` for "mission"
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
      anchorOrigin={{
        vertical: openAbove ? 'top' : 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: openAbove ? 'bottom' : 'top',
        horizontal: 'center',
      }}
      PaperProps={{
        className: classes.paper,
        onKeyDown: filterable ? handleKeyDown : undefined,
      }}
      onClose={onClose}
      onFocus={onFocus}
    >
      <div className={classes.content} tabIndex={0}>
        {filtered.length > 0 ? (
          filtered.map(({ uavId, missionId }) => (
            // Enclose the Avatar in a `div`, as it renders a fragment
            <div key={`${uavId}:${missionId}`}>
              {(() => {
                const avatarProps = {
                  style: { cursor: 'pointer' },
                  onClick() {
                    onSelect(useMissionIds ? missionId : uavId);
                    onClose();
                  },
                };

                return uavId ? (
                  <DroneAvatar
                    label={
                      useMissionIds ? formatMissionId(missionId) : undefined
                    }
                    variant='minimal'
                    id={uavId}
                    AvatarProps={avatarProps}
                  />
                ) : (
                  <DronePlaceholder
                    label={formatMissionId(missionId)}
                    AvatarProps={avatarProps}
                  />
                );
              })()}
            </div>
          ))
        ) : filter ? (
          <BackgroundHint text={t('UAVSelector.noMatchingUAVs', { filter })} />
        ) : (
          <BackgroundHint
            text={`No available ${useMissionIds ? 'mission ids' : 'UAVs'}.`}
          />
        )}
      </div>
    </Popover>
  );
};

UAVSelector.propTypes = {
  anchorEl: PropTypes.object, // TODO: Find a more exact PropType for this!
  filterable: PropTypes.bool,
  onClose: PropTypes.func,
  onFocus: PropTypes.func,
  onSelect: PropTypes.func,
  open: PropTypes.bool,
  sortedByError: PropTypes.bool,
  useMissionIds: PropTypes.bool,
};

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
      <UAVSelector
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
};
