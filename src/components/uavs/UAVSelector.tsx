/**
 * @file Component that allows the user to select a UAV from a dropdown list.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallowEqual, useSelector } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import { BackgroundHint } from '@skybrush/mui-components';

import { PopoverWithContainerFromContext as Popover } from '~/containerContext';
import {
  getMissionMapping,
  getReverseMissionMapping,
} from '~/features/mission/selectors';
import {
  getUAVIdList,
  getUAVIdsSortedByErrorCode,
} from '~/features/uavs/selectors';
import { type MissionIndex } from '~/model/missions';
import { type Identifier } from '~/utils/collections';
import { formatMissionId } from '~/utils/formatting';

import DroneAvatar from './DroneAvatar';
import DronePlaceholder from './DronePlaceholder';

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

export type UAVSelectorProps = {
  anchorEl: Element | null;
  /**
   * Controlled filter string (e.g. from an external TextField). When set,
   * overrides the internal keyboard filter used by `filterable`.
   */
  filter?: string;
  /**
   * Enables typing digits / `s` inside the popover to filter. Ignored when
   * `filter` is controlled externally.
   */
  filterable?: boolean;
  onClose: () => void;
  onFocus?: (event: React.FocusEvent) => void;
  onSelect: (item: { uavId?: Identifier; missionIndex?: MissionIndex }) => void;
  open: boolean;
  /**
   * Keep keyboard focus on the anchor (e.g. a TextField). Disables popover
   * autofocus and prevents mousedown inside the list from stealing focus.
   */
  retainFocus?: boolean;
  sortedByError?: boolean;
  useMissionIds?: boolean;
};

export const UAVSelector = ({
  anchorEl,
  filter: filterProp,
  filterable,
  onClose,
  onFocus,
  onSelect,
  open,
  retainFocus,
  sortedByError,
  useMissionIds,
}: UAVSelectorProps) => {
  const { t } = useTranslation();
  const uavIds = useSelector(
    sortedByError ? getUAVIdsSortedByErrorCode : getUAVIdList,
    { equalityFn: shallowEqual }
  );
  const reverseMissionMapping = useSelector(getReverseMissionMapping);
  const missionMapping = useSelector(getMissionMapping);

  // TODO: `missionIndex` is only guaranteed to be defined if `useMissionIds` is
  //       `true`, since `reverseMissionMapping` doesn't necessarily contain all
  //       UAVs. We would need dependent types to express this though...
  const items = useMissionIds
    ? missionMapping.map((uavId, index) => ({
        uavId: uavId ?? undefined,
        missionIndex: index,
      }))
    : uavIds.map((uavId) => ({
        uavId,
        missionIndex: reverseMissionMapping[uavId],
      }));

  const { anchorCenter = 0, openAbove } =
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

  const classes = useStyles();

  const isFilterControlled = filterProp !== undefined;
  const [internalFilter, setInternalFilter] = useState('');

  // Clear the internal filter each time the popover is opened.
  useEffect(() => {
    if (open && !isFilterControlled) {
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setInternalFilter('');
    }
  }, [open, isFilterControlled]);

  const filter = isFilterControlled ? filterProp : internalFilter;
  const normalizedFilter = filter.toLowerCase();

  const filtered = items.filter(
    ({ uavId, missionIndex }) =>
      uavId?.toLowerCase()?.startsWith(normalizedFilter) ||
      (missionIndex !== undefined &&
        formatMissionId(missionIndex).startsWith(normalizedFilter))
  );

  const preferMissionIdLabels =
    useMissionIds || normalizedFilter.startsWith('s');

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
        setInternalFilter(internalFilter.slice(0, -1));

        break;
      }

      // TODO: Generalize this, it could be `s` for "show" and `m` for "mission"
      case 's': {
        if (internalFilter.startsWith('s')) {
          setInternalFilter(internalFilter.slice(1));
        } else {
          setInternalFilter('s' + internalFilter);
        }

        event.stopPropagation();

        break;
      }

      default: {
        if (/^\d$/.test(event.key)) {
          setInternalFilter(internalFilter + event.key);
          event.stopPropagation();
        }
      }
    }
  };

  return (
    <Popover
      disableAutoFocus={retainFocus}
      disableEnforceFocus={retainFocus}
      disableRestoreFocus={retainFocus}
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
              [openAbove ? 'bottom' : 'top']: `-${theme.spacing(1)}`,
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
          onKeyDown:
            filterable && !isFilterControlled ? handleKeyDown : undefined,
        },
      }}
      onClose={onClose}
      onFocus={onFocus}
    >
      {/*
        Keep focus in the anchor when `retainFocus` is set (TextField-driven UX).
      */}
      <div
        className={classes.content}
        tabIndex={retainFocus ? undefined : 0}
        onMouseDown={
          retainFocus
            ? (event) => {
                event.preventDefault();
              }
            : undefined
        }
      >
        {filtered.length > 0 ? (
          filtered.map(({ uavId, missionIndex }) => {
            const avatarProps = {
              style: { cursor: 'pointer' },
              onClick: () => {
                onSelect({ uavId, missionIndex });
                onClose();
              },
            };

            return (
              // Enclose the Avatar in a `div`, as it renders a fragment
              <div key={`${uavId}:${missionIndex}`}>
                {uavId ? (
                  <DroneAvatar
                    label={
                      preferMissionIdLabels && missionIndex !== undefined
                        ? formatMissionId(missionIndex)
                        : undefined
                    }
                    variant='minimal'
                    id={uavId}
                    AvatarProps={avatarProps}
                  />
                ) : (
                  <DronePlaceholder
                    label={formatMissionId(missionIndex)}
                    AvatarProps={avatarProps}
                  />
                )}
              </div>
            );
          })
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

type UAVSelectorWrapperProps = {
  children: (handleClick: (event: React.MouseEvent) => void) => React.ReactNode;
} & Omit<UAVSelectorProps, 'anchorEl' | 'open' | 'onClose' | 'onFocus'>;

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
