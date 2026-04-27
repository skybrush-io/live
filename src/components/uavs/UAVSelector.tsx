/**
 * @file Component that allows the user to select a UAV from a dropdown list.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import { BackgroundHint } from '@skybrush/mui-components';

import { PopoverWithContainerFromContext as Popover } from '~/containerContext';
import { getReverseMissionMapping } from '~/features/mission/selectors';
import {
  getUAVIdList,
  getUAVIdsSortedByErrorCode,
} from '~/features/uavs/selectors';
import { formatMissionId } from '~/utils/formatting';

import DroneAvatar from './DroneAvatar';

const SCROLLBAR_WIDTH = 10;

const useStyles = makeStyles((theme) => ({
  content: {
    // HACK: Push the scrollbar to the outer edge of the popup
    marginRight: -SCROLLBAR_WIDTH,

    width:
      5 * 40 + // Five avatars
      6 * Number.parseInt(theme.spacing(1)) + // Paddings and gaps
      SCROLLBAR_WIDTH,
    maxHeight:
      5 * 40 + // Five avatars
      6 * Number.parseInt(theme.spacing(1)), // Paddings and gaps

    padding: theme.spacing(1),

    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),

    overflow: 'hidden auto',
  },
}));

type UAVSelectorProps = {
  anchorEl: Element | null;
  filterable?: boolean;
  onClose: () => void;
  onFocus: (event: React.FocusEvent) => void;
  onSelect: (uavId: string) => void;
  open: boolean;
  sortedByError?: boolean;
};

const UAVSelector = ({
  anchorEl,
  filterable,
  onClose,
  onFocus,
  onSelect,
  open,
  sortedByError,
}: UAVSelectorProps) => {
  const { t } = useTranslation();
  const uavIds = useSelector(
    sortedByError ? getUAVIdsSortedByErrorCode : getUAVIdList,
    { equalityFn: shallowEqual }
  );
  const reverseMissionMapping = useSelector(getReverseMissionMapping);

  const anchorCenter = useMemo(() => {
    if (!anchorEl) {
      return 0;
    }

    const { left, right } = anchorEl.getBoundingClientRect();
    return (left + right) / 2;
  }, [anchorEl]);

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

  const handleKeyDown = (event: React.KeyboardEvent) => {
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
      slotProps={{
        paper: {
          sx: (theme) => ({
            overflow: 'visible',

            '&::before': {
              content: '""',
              display: 'block',

              width: theme.spacing(2),
              height: theme.spacing(2),

              position: 'absolute',
              top: `-${theme.spacing(1)}`,
              left: `calc(50% - ${theme.spacing(1)} + ${
                // Adjust arrow position when the `Popover` is pushed against the
                // edge of the viewport, thus isn't centered on the anchor element
                (() => {
                  const margin = Number.parseInt(theme.spacing(2));
                  const width =
                    5 * 40 + // Five avatars
                    6 * Number.parseInt(theme.spacing(1)); // Paddings and gaps
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
          onKeyDown: filterable ? handleKeyDown : undefined,
        },
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
          <BackgroundHint text={t('UAVSelector.noMatchingUAVs', { filter })} />
        )}
      </div>
    </Popover>
  );
};

type UAVSelectorWrapperProps = {
  children: (handleClick: (event: React.MouseEvent) => void) => React.ReactNode;
  onSelect: (uavId: string) => void;
  sortedByError?: boolean;
};

type ElementWithFocusRestorationTarget = Element & {
  focusRestorationTarget?: HTMLElement | null;
};

/**
 * Wrapper component that provides a `handleClick` function for the children
 * components to be attached to the target that should trigger the selector
 */
export const UAVSelectorWrapper = ({
  children,
  ...rest
}: UAVSelectorWrapperProps) => {
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const [focusRestorationTarget, setFocusRestorationTarget] =
    useState<HTMLElement | null>(null);

  const handleClick = (event: React.MouseEvent) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFocus = (
    event: React.FocusEvent<Element, ElementWithFocusRestorationTarget>
  ) => {
    if (event?.relatedTarget?.focusRestorationTarget) {
      setFocusRestorationTarget(event.relatedTarget.focusRestorationTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
    if (focusRestorationTarget) {
      setTimeout(() => {
        focusRestorationTarget.focus();
      }, 0);
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
