/* eslint-disable @typescript-eslint/naming-convention */
import clsx from 'clsx';
import createColor from 'color';
import type { TFunction } from 'i18next';
import React, { useCallback, useRef, type SyntheticEvent } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Chip, { type ChipProps } from '@material-ui/core/Chip';
import Divider from '@material-ui/core/Divider';
import Menu from '@material-ui/core/Menu';
import MenuItem, { type MenuItemProps } from '@material-ui/core/MenuItem';
import { type Theme, makeStyles } from '@material-ui/core/styles';
import Check from '@material-ui/icons/Check';
import Filter from '@material-ui/icons/FilterList';
import SortAscending from '@material-ui/icons/ArrowDownward';
import SortDescending from '@material-ui/icons/ArrowUpward';
import type { PopupState } from 'material-ui-popup-state/core';
import {
  bindMenu,
  bindTrigger,
  usePopupState,
} from 'material-ui-popup-state/hooks';

import { isThemeDark, monospacedFont } from '@skybrush/app-theme-material-ui';

import Colors from '~/components/colors';
import FadeAndSlide from '~/components/transitions/FadeAndSlide';
import {
  setSingleUAVListFilter,
  setUAVListSortPreference,
  toggleUAVListSortDirection,
} from '~/features/settings/actions';
import {
  getUAVListFilters,
  getUAVListLayout,
  getUAVListSortPreference,
  isShowingMissionIds,
} from '~/features/settings/selectors';
import {
  UAVListLayout,
  type UAVSortKeyAndOrder,
} from '~/features/settings/types';
import {
  UAVFilter,
  UAVFilters,
  labelsForUAVFilter,
  shortLabelsForUAVFilter,
} from '~/model/filtering';
import {
  UAVSortKey,
  UAVSortKeys,
  labelsForUAVSortKey,
  shortLabelsForUAVSortKey,
} from '~/model/sorting';
import type { Nullable } from '~/utils/types';
import type { RootState } from '~/store/reducers';

import { HEADER_HEIGHT } from './constants';

const createChipStyle = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  color: string | null,
  theme: Theme
): Record<string, any> => {
  const result: Record<string, any> = {
    cursor: 'hand',
    '& .MuiChip-deleteIcon': {
      color: 'inherit',
    },
  };

  if (color) {
    const lighter = createColor(color).hsl().lighten(0.08).string();
    result['color'] = theme.palette.getContrastText(color);
    result['backgroundColor'] = color;
    result['boxShadow'] = `0 0 4px 2px ${color}`;
    result['&:focus'] = {
      color: theme.palette.getContrastText(color),
      backgroundColor: [lighter, '!important'],
    };
    result['&:hover'] = {
      color: theme.palette.getContrastText(color),
      backgroundColor: [lighter, '!important'],
    };
    result['& svg'] = {
      color: [theme.palette.getContrastText(color), '!important'],
    };
  }

  return result;
};

const useStyles = makeStyles(
  (theme) => ({
    root: {
      backdropFilter: 'blur(5px)',
      background: isThemeDark(theme)
        ? 'rgba(36, 36, 36, 0.54)'
        : 'rgba(255, 255, 255, 0.8)',
      borderBottom: `1px solid ${theme.palette.divider}`,
      minWidth: 800,
      overflow: 'hidden',
      zIndex: 10,
      minHeight: HEADER_HEIGHT + 1 /* 1px for the border */,
    },

    floating: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },

    widgets: {
      display: 'flex',
      position: 'absolute',
      right: theme.spacing(0.5),
      top: theme.spacing(1),
      margin: 'auto',
      zIndex: 20,

      '& div': {
        margin: theme.spacing(0, 0, 0, 0.5),
      },
    },

    headerLine: {
      alignItems: 'stretch',
      cursor: 'default',
      display: 'flex',
      flexWrap: 'nowrap',
      fontFamily: monospacedFont,
      fontSize: 'small',
      height: HEADER_HEIGHT,
      overflow: 'hidden',
      userSelect: 'none',
      whiteSpace: 'pre',
      width: '100%',
      zIndex: 10,
    },

    headerLineItem: {
      lineHeight: HEADER_HEIGHT + 'px',
      padding: theme.spacing(0, 0.5),
      flexShrink: 0, // important, otherwise the fixed width will not be respected if the view is very narrow

      '&:last-child': {
        flex: 1,
      },
    },

    sortable: {
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
      transition: theme.transitions.create(['background-color'], {
        duration: theme.transitions.duration.short,
      }),
    },

    sortActive: {
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
    },

    success: createChipStyle(Colors.success, theme),
    warning: createChipStyle(Colors.warning, theme),
    error: createChipStyle(Colors.error, theme),

    chip: createChipStyle(null, theme),
    chipActive: createChipStyle(Colors.info, theme),
  }),
  {
    name: 'SortAndFilterHeader',
  }
);

type HeaderPart = {
  sortKey?: UAVSortKey;
  label: string;
  style: React.CSSProperties;
};

const COMMON_HEADER_TEXT_PARTS: readonly HeaderPart[] = Object.freeze([
  {
    label: 'Status',
    sortKey: UAVSortKey.STATUS,
    style: {
      textAlign: 'center',
      width: 78,
    },
  },
  {
    label: 'Mode',
    sortKey: UAVSortKey.FLIGHT_MODE,
    style: {
      textAlign: 'center',
      width: 62,
    },
  },
  {
    label: 'Battery',
    sortKey: UAVSortKey.BATTERY,
    style: {
      textAlign: 'right',
      width: 62,
    },
  },
  {
    label: 'RSSI',
    sortKey: UAVSortKey.RSSI,
    style: {
      textAlign: 'center',
      width: 100,
    },
  },
  {
    label: 'GPS',
    sortKey: UAVSortKey.GPS_FIX,
    style: {
      textAlign: 'center',
      width: 40,
    },
  },
  {
    label: 'Position',
    style: {
      textAlign: 'left',
      width: 198,
    },
  },
  {
    label: 'AMSL',
    sortKey: UAVSortKey.ALTITUDE_MSL,
    style: {
      textAlign: 'right',
      width: 58,
    },
  },
  {
    label: 'AHL',
    sortKey: UAVSortKey.ALTITUDE_HOME,
    style: {
      textAlign: 'right',
      width: 56,
    },
  },
  {
    label: 'AGL',
    sortKey: UAVSortKey.ALTITUDE_GROUND,
    style: {
      textAlign: 'right',
      width: 48,
    },
  },
  {
    label: 'Hdg',
    sortKey: UAVSortKey.HEADING,
    style: {
      textAlign: 'center',
      width: 40,
    },
  },
  {
    label: 'Details',
    style: {
      textAlign: 'left',
    },
  },
]);

const HEADER_TEXT_PARTS: Record<string, HeaderPart[]> = {
  missionIds: [
    {
      label: 'sID',
      sortKey: UAVSortKey.DEFAULT,
      style: {
        textAlign: 'right',
        width: 48,
      },
    },
    {
      label: 'ID',
      sortKey: UAVSortKey.DEFAULT,
      style: {
        textAlign: 'right',
        width: 40,
      },
    },
    ...COMMON_HEADER_TEXT_PARTS,
  ],
  droneIds: [
    {
      label: 'ID',
      sortKey: UAVSortKey.DEFAULT,
      style: {
        textAlign: 'right',
        width: 40,
      },
    },
    {
      label: 'sID',
      sortKey: UAVSortKey.DEFAULT,
      style: {
        textAlign: 'right',
        width: 32,
      },
    },
    ...COMMON_HEADER_TEXT_PARTS,
  ],
};

const checkStyle = { fontSize: 'inherit', marginLeft: 8 };
const check = <Check style={checkStyle} />;

const getFilterChipClass = (
  filters: UAVFilter[],
  classes: ReturnType<typeof useStyles>
): string => {
  const isFilterActive = Array.isArray(filters) && filters.length > 0;

  if (isFilterActive) {
    switch (filters[0]) {
      case UAVFilter.WITH_WARNINGS:
      case UAVFilter.INACTIVE_ONLY:
        return classes.warning;

      case UAVFilter.WITH_ERRORS:
        return classes.error;

      default:
        return classes.chipActive;
    }
  } else {
    return classes.chip;
  }
};

type CheckableMenuItemProps = MenuItemProps & Readonly<{ label: string }>;

const CheckableMenuItem = React.forwardRef<
  HTMLLIElement,
  CheckableMenuItemProps
>(({ label, selected, ...rest }, ref) => (
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  <MenuItem ref={ref as any} dense {...(rest as any)}>
    {label}
  </MenuItem>
));

function bindChip({
  state,
  ref,
  action,
  popupTrigger = 'chip',
}: {
  state: PopupState;
  ref?: HTMLElement;
  action?: () => void;
  popupTrigger?: 'chip' | 'icon';
}): Partial<ChipProps> {
  const result: Partial<ChipProps> = bindTrigger(state);
  const opener = (event: SyntheticEvent<any>): void => {
    state.open(ref ?? event);
  };

  result.onContextMenu = result.onClick;

  if (popupTrigger === 'icon') {
    // The whole chip triggers the default action, the right icon opens the popup
    result.onDelete = opener;
    if (action) {
      result.onClick = action;
    }
  } else {
    // Right icon triggers special action (if any), the whole chip opens the popup
    result.onDelete = action ?? opener;
  }

  return result;
}

function formatHeaderParts(
  parts: string | HeaderPart[] | undefined,
  sortBy: UAVSortKeyAndOrder,
  classes: ReturnType<typeof useStyles>,
  onClick: (key: UAVSortKey) => void
): React.ReactNode {
  if (typeof parts === 'string') {
    // Whole header is a single item
    return parts;
  } else if (Array.isArray(parts)) {
    return parts.map(({ label, sortKey, style }) => (
      <div
        key={label}
        className={clsx(
          classes.headerLineItem,
          sortKey && classes.sortable,
          sortBy.key === sortKey &&
            sortKey !== UAVSortKey.DEFAULT &&
            classes.sortActive
        )}
        style={style}
        onClick={
          sortKey
            ? (): void => {
                onClick(sortKey);
              }
            : undefined
        }
      >
        {label}
      </div>
    ));
  } else {
    return '';
  }
}

type SortAndFilterHeaderProps = Readonly<{
  filters: UAVFilter[];
  floating?: boolean;
  layout: UAVListLayout;
  onSetFilter: (filter: Nullable<UAVFilter>) => void;
  onSetSortBy: (sortBy: Partial<UAVSortKeyAndOrder>) => void;
  onToggleSortDirection: () => void;
  showMissionIds: boolean;
  sortBy: UAVSortKeyAndOrder;
  t: TFunction;
}>;

const SortAndFilterHeader = ({
  filters,
  floating,
  layout,
  onSetFilter,
  onSetSortBy,
  onToggleSortDirection,
  showMissionIds,
  sortBy,
  t,
}: SortAndFilterHeaderProps): JSX.Element => {
  const classes = useStyles();
  const sortChipRef = useRef<HTMLDivElement>();
  const sortPopupState = usePopupState({
    variant: 'popover',
    popupId: 'uav-list-sort-options',
  });
  const filterChipRef = useRef<HTMLDivElement>();
  const filterPopupState = usePopupState({
    variant: 'popover',
    popupId: 'uav-list-filter-options',
  });

  const setFilter = useCallback(
    (value: Nullable<UAVFilter>) => {
      if (onSetFilter) {
        onSetFilter(value);
      }

      filterPopupState.close();
    },
    [onSetFilter, filterPopupState]
  );
  const setSortKey = useCallback(
    (value: UAVSortKey) => {
      if (onSetSortBy) {
        onSetSortBy({ key: value });
      }

      sortPopupState.close();
    },
    [onSetSortBy, sortPopupState]
  );
  const setSortReversed = useCallback(
    (value: boolean) => {
      if (onSetSortBy) {
        onSetSortBy({ reverse: Boolean(value) });
      }

      sortPopupState.close();
    },
    [onSetSortBy, sortPopupState]
  );
  const onSetSortKeyOrToggleSortDirection = useCallback(
    (value: UAVSortKey) => {
      if (sortBy.key === value) {
        if (onToggleSortDirection) {
          onToggleSortDirection();
        }
      } else {
        if (onSetSortBy) {
          onSetSortBy({ key: value });
        }
      }
    },
    [onSetSortBy, onToggleSortDirection, sortBy]
  );

  const isSortActive = sortBy.key !== UAVSortKey.DEFAULT;
  const isFilterActive = Array.isArray(filters) && filters.length > 0;

  return (
    <div className={clsx(classes.root, floating && classes.floating)}>
      <div className={classes.widgets}>
        <Chip
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          ref={sortChipRef as any}
          className={isSortActive ? classes.chipActive : classes.chip}
          variant='outlined'
          label={shortLabelsForUAVSortKey[sortBy.key](t)}
          size='small'
          deleteIcon={sortBy?.reverse ? <SortDescending /> : <SortAscending />}
          {...bindChip({
            state: sortPopupState,
            ref: sortChipRef.current,
            action: onToggleSortDirection,
          })}
        />
        <Menu {...bindMenu(sortPopupState)}>
          <MenuItem dense disabled>
            {t('sorting.sortBy')}
          </MenuItem>
          {UAVSortKeys.map((sortKey) => (
            <CheckableMenuItem
              key={sortKey}
              label={labelsForUAVSortKey[sortKey](t)}
              selected={sortBy.key === sortKey}
              onClick={() => {
                setSortKey(sortKey);
              }}
            />
          ))}
          <Divider style={{ margin: '4px 0' }} />
          <MenuItem
            dense
            onClick={() => {
              setSortReversed(false);
            }}
          >
            {t('sorting.ascending')}
            {!sortBy?.reverse && check}
          </MenuItem>
          <MenuItem
            dense
            onClick={() => {
              setSortReversed(true);
            }}
          >
            {t('sorting.descending')}
            {sortBy?.reverse && check}
          </MenuItem>
        </Menu>

        <Chip
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          ref={filterChipRef as any}
          className={getFilterChipClass(filters, classes)}
          variant='outlined'
          label={
            isFilterActive
              ? filters.length > 1
                ? t('filtering.composite')
                : shortLabelsForUAVFilter[filters[0]!](t)
              : t('filtering.filter')
          }
          size='small'
          deleteIcon={
            isFilterActive ? undefined /* default X icon */ : <Filter />
          }
          {...bindChip({
            state: filterPopupState,
            ref: filterChipRef.current,
            action: isFilterActive
              ? (): void => {
                  setFilter(null);
                }
              : undefined,
          })}
        />
        <Menu {...bindMenu(filterPopupState)}>
          <MenuItem dense disabled>
            {t('filtering.filterBy')}
          </MenuItem>
          {UAVFilters.map((filter) => (
            <CheckableMenuItem
              key={filter}
              label={labelsForUAVFilter[filter](t)}
              selected={
                (filters.length === 1 && filters[0] === filter) ||
                (filter === UAVFilter.DEFAULT && filters.length === 0)
              }
              onClick={() => {
                setFilter(filter);
              }}
            />
          ))}
        </Menu>
      </div>
      <FadeAndSlide in={layout === UAVListLayout.LIST}>
        <div className={classes.headerLine}>
          {formatHeaderParts(
            showMissionIds
              ? HEADER_TEXT_PARTS['missionIds']
              : HEADER_TEXT_PARTS['droneIds'],
            sortBy,
            classes,
            onSetSortKeyOrToggleSortDirection
          )}
        </div>
      </FadeAndSlide>
    </div>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    filters: getUAVListFilters(state),
    layout: getUAVListLayout(state),
    showMissionIds: isShowingMissionIds(state),
    sortBy: getUAVListSortPreference(state),
  }),
  // mapDispatchToProps
  {
    onSetFilter: setSingleUAVListFilter,
    onSetSortBy: setUAVListSortPreference,
    onToggleSortDirection: toggleUAVListSortDirection,
  }
)(withTranslation()(SortAndFilterHeader));
