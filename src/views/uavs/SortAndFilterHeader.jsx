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
import { UAVSortKey, UAVSortKeys, labelsForUAVSortKey } from '~/model/sorting';
import { isDark, monospacedFont } from '~/theme';

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

const HEIGHT = 32;

const useStyles = makeStyles(
  (theme) => ({
    root: {
      backdropFilter: 'blur(5px)',
      background: isDark(theme)
        ? 'rgba(36, 36, 36, 0.54)'
        : 'rgba(255, 255, 255, 0.8)',
      borderBottom: `1px solid ${theme.palette.divider}`,
      minWidth: 800,
      overflow: 'hidden',
      padding: theme.spacing(0.5, 0),
      position: 'sticky',
      top: 0,
      zIndex: 10,
      minHeight: HEIGHT + theme.spacing(0.5) + 1 /* 1px for the border */,
    },

    widgets: {
      display: 'flex',
      padding: theme.spacing(0.5),
      position: 'absolute',
      right: 0,
      margin: 'auto',
      zIndex: 20,

      '& div': {
        margin: theme.spacing(0, 0, 0, 0.5),
      },
    },

    headerLine: {
      cursor: 'default',
      fontFamily: monospacedFont,
      fontSize: 'small',
      lineHeight: HEIGHT + 'px',
      userSelect: 'none',
      whiteSpace: 'pre',
      width: '100%',
      zIndex: 10,
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

const HEADER_TEXT = {
  missionIds:
    ' sID  ID   Status    Mode  Battery   GPS  Position                  AMSL    AGL  Hdg  Details',
  droneIds:
    '  ID sID   Status    Mode  Battery   GPS  Position                  AMSL    AGL  Hdg  Details',
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

  const isSortActive = sortBy.key !== UAVSortKey.DEFAULT;
  const isFilterActive = Array.isArray(filters) && filters.length > 0;

  return (
    <div className={classes.root}>
      <div className={classes.widgets}>
        <Chip
          ref={sortChipRef}
          className={isSortActive ? classes.chipActive : classes.chip}
          variant='outlined'
          label={labelsForUAVSortKey[sortBy.key] || 'Default'}
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
          {showMissionIds ? HEADER_TEXT.missionIds : HEADER_TEXT.droneIds}
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
