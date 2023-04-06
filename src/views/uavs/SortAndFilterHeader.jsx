import clsx from 'clsx';
import createColor from 'color';
import PropTypes from 'prop-types';
import React, { useCallback, useRef } from 'react';
import { connect } from 'react-redux';

import Chip from '@material-ui/core/Chip';
import Divider from '@material-ui/core/Divider';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Check from '@material-ui/icons/Check';
import Filter from '@material-ui/icons/FilterList';
import SortAscending from '@material-ui/icons/ArrowDownward';
import SortDescending from '@material-ui/icons/ArrowUpward';
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

const createChipStyle = (color, theme) => {
  const result = {
    cursor: 'hand',
    '& .MuiChip-deleteIcon': {
      color: 'inherit',
    },
  };

  if (color) {
    const lighter = createColor(color).hsl().lighten(0.08).string();
    result.color = theme.palette.getContrastText(color);
    result.backgroundColor = color;
    result.boxShadow = `0 0 4px 2px ${color}`;
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

const HEIGHT = 38;

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
      position: 'sticky',
      top: 0,
      zIndex: 10,
      minHeight: HEIGHT + 1 /* 1px for the border */,
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
      height: HEIGHT,
      overflow: 'hidden',
      userSelect: 'none',
      whiteSpace: 'pre',
      width: '100%',
      zIndex: 10,
    },

    headerLineItem: {
      lineHeight: HEIGHT + 'px',
      padding: theme.spacing(0, 0.5),

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

const COMMON_HEADER_TEXT_PARTS = Object.freeze([
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
    label: 'GPS',
    sortKey: UAVSortKey.GPS_FIX,
    style: {
      textAlign: 'center',
      width: 50,
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

const HEADER_TEXT_PARTS = {
  missionIds: [
    {
      label: 'sID',
      sortKey: UAVSortKey.DEFAULT,
      style: {
        textAlign: 'right',
        width: 40,
      },
    },
    {
      label: 'ID',
      sortKey: UAVSortKey.DEFAULT,
      style: {
        textAlign: 'right',
        width: 32,
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

const getFilterChipClass = (filters, classes) => {
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

const CheckableMenuItem = React.forwardRef(
  ({ label, selected, ...rest }, ref) => (
    <MenuItem ref={ref} dense selected={selected} {...rest}>
      {label}
    </MenuItem>
  )
);

CheckableMenuItem.propTypes = {
  label: PropTypes.string,
  selected: PropTypes.bool,
};

function bindChip({ state, ref, action, popupTrigger = 'chip' }) {
  const result = bindTrigger(state);
  const opener = (event) => state.open(ref || event);

  result.onContextMenu = result.onClick;

  if (popupTrigger === 'icon') {
    // The whole chip triggers the default action, the right icon opens the popup
    result.onDelete = opener;
    if (action) {
      result.onClick = action;
    }
  } else {
    // Right icon triggers special action (if any), the whole chip opens the popup
    result.onDelete = action || opener;
  }

  return result;
}

function formatHeaderParts(parts, sortBy, classes, onClick) {
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
        onClick={sortKey ? () => onClick(sortKey) : null}
      >
        {label}
      </div>
    ));
  } else {
    return '';
  }
}

const SortAndFilterHeader = ({
  filters,
  layout,
  onSetFilter,
  onSetSortBy,
  onToggleSortDirection,
  showMissionIds,
  sortBy,
}) => {
  const classes = useStyles();
  const sortChipRef = useRef();
  const sortPopupState = usePopupState({
    variant: 'popover',
    popupId: 'uav-list-sort-options',
  });
  const filterChipRef = useRef();
  const filterPopupState = usePopupState({
    variant: 'popover',
    popupId: 'uav-list-filter-options',
  });

  const setFilter = useCallback(
    (value) => {
      if (onSetFilter) {
        onSetFilter(value);
      }

      filterPopupState.close();
    },
    [onSetFilter, filterPopupState]
  );
  const setSortKey = useCallback(
    (value) => {
      if (onSetSortBy) {
        onSetSortBy({ key: String(value) });
      }

      sortPopupState.close();
    },
    [onSetSortBy, sortPopupState]
  );
  const setSortReversed = useCallback(
    (value) => {
      if (onSetSortBy) {
        onSetSortBy({ reverse: Boolean(value) });
      }

      sortPopupState.close();
    },
    [onSetSortBy, sortPopupState]
  );
  const onSetSortKeyOrToggleSortDirection = useCallback(
    (value) => {
      value = String(value);

      if (sortBy.key === value) {
        if (onToggleSortDirection) {
          onToggleSortDirection();
        }
      } else {
        if (onSetSortBy) {
          onSetSortBy({ key: String(value) });
        }
      }
    },
    [onSetSortBy, onToggleSortDirection, sortBy]
  );

  const isSortActive = sortBy.key !== UAVSortKey.DEFAULT;
  const isFilterActive = Array.isArray(filters) && filters.length > 0;

  return (
    <div className={classes.root}>
      <div className={classes.widgets}>
        <Chip
          ref={sortChipRef}
          className={isSortActive ? classes.chipActive : classes.chip}
          variant='outlined'
          label={shortLabelsForUAVSortKey[sortBy.key] || 'Default'}
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
            Sort by
          </MenuItem>
          {UAVSortKeys.map((sortKey) => (
            <CheckableMenuItem
              key={sortKey}
              label={labelsForUAVSortKey[sortKey]}
              selected={sortBy.key === sortKey}
              onClick={() => setSortKey(sortKey)}
            />
          ))}
          <Divider style={{ margin: '4px 0' }} />
          <MenuItem dense onClick={() => setSortReversed(false)}>
            Ascending{!sortBy?.reverse && check}
          </MenuItem>
          <MenuItem dense onClick={() => setSortReversed(true)}>
            Descending{sortBy?.reverse && check}
          </MenuItem>
        </Menu>

        <Chip
          ref={filterChipRef}
          className={getFilterChipClass(filters, classes)}
          variant='outlined'
          label={
            isFilterActive
              ? filters.length > 1
                ? 'Composite'
                : shortLabelsForUAVFilter[filters[0]]
              : 'Filter'
          }
          size='small'
          deleteIcon={
            !isFilterActive ? <Filter /> : undefined /* default X icon */
          }
          {...bindChip({
            state: filterPopupState,
            ref: filterChipRef.current,
            action: isFilterActive ? () => setFilter(null) : null,
          })}
        />
        <Menu {...bindMenu(filterPopupState)}>
          <MenuItem dense disabled>
            Filter by
          </MenuItem>
          {UAVFilters.map((filter) => (
            <CheckableMenuItem
              key={filter}
              label={labelsForUAVFilter[filter]}
              selected={
                (filters.length === 1 && filters[0] === filter) ||
                (filter === UAVFilter.DEFAULT && filters.length === 0)
              }
              onClick={() => setFilter(filter)}
            />
          ))}
        </Menu>
      </div>
      <FadeAndSlide in={layout === 'list'}>
        <div className={classes.headerLine}>
          {formatHeaderParts(
            showMissionIds
              ? HEADER_TEXT_PARTS.missionIds
              : HEADER_TEXT_PARTS.droneIds,
            sortBy,
            classes,
            onSetSortKeyOrToggleSortDirection
          )}
        </div>
      </FadeAndSlide>
    </div>
  );
};

SortAndFilterHeader.propTypes = {
  filters: PropTypes.arrayOf(PropTypes.string),
  layout: PropTypes.oneOf(['grid', 'list']),
  onSetFilter: PropTypes.func,
  onSetSortBy: PropTypes.func,
  onToggleSortDirection: PropTypes.func,
  showMissionIds: PropTypes.bool,
  sortBy: PropTypes.shape({
    key: PropTypes.string,
    reverse: PropTypes.bool,
  }),
};

export default connect(
  // mapStateToProps
  (state) => ({
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
)(SortAndFilterHeader);
