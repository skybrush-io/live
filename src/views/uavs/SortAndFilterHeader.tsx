/* eslint-disable @typescript-eslint/naming-convention */
import SortAscending from '@mui/icons-material/ArrowDownward';
import SortDescending from '@mui/icons-material/ArrowUpward';
import Check from '@mui/icons-material/Check';
import Filter from '@mui/icons-material/FilterList';
import GpsFixed from '@mui/icons-material/GpsFixed';
import SatelliteAlt from '@mui/icons-material/SatelliteAlt';
import Sort from '@mui/icons-material/Sort';
import Chip, { type ChipProps } from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MenuItem, { type MenuItemProps } from '@mui/material/MenuItem';
import type { Theme } from '@mui/material/styles';
import clsx from 'clsx';
import type { TFunction } from 'i18next';
import {
  bindMenu,
  bindTrigger,
  usePopupState,
  type PopupState,
} from 'material-ui-popup-state/hooks';
import React, { useCallback, useRef, type SyntheticEvent } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { isThemeDark, makeStyles } from '@skybrush/app-theme-mui';

import Colors from '~/components/colors';
import { selectGpsFleetSummary } from '~/features/uavs/gpsFleetSummary';
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
import type { RootState } from '~/store/reducers';
import type { Nullable } from '~/utils/types';

import { FILTER_BAR_HEIGHT } from './constants';

const menuPaperProps = {
  elevation: 8,
  sx: {
    borderRadius: 2,
    minWidth: 180,
    mt: 0.5,
  },
};

const useStyles = makeStyles((theme: Theme) => {
  const dark = isThemeDark(theme);
  const chipBase = {
    borderRadius: 999,
    fontSize: '0.72rem',
    fontWeight: 600,
    height: 30,
    letterSpacing: '0.02em',
    transition: theme.transitions.create(
      ['background-color', 'border-color', 'box-shadow', 'color'],
      { duration: theme.transitions.duration.short }
    ),
    '& .MuiChip-deleteIcon': {
      color: 'inherit',
      fontSize: '1rem',
      opacity: 0.85,
    },
    '& .MuiChip-icon': {
      color: 'inherit',
      fontSize: '0.95rem',
      marginLeft: theme.spacing(1),
      opacity: 0.9,
    },
    '& .MuiChip-label': {
      paddingLeft: theme.spacing(0.75),
      paddingRight: theme.spacing(1.25),
    },
  };

  return {
    root: {
      backdropFilter: 'blur(10px)',
      background: dark
        ? 'linear-gradient(180deg, rgba(20, 24, 32, 0.96) 0%, rgba(14, 18, 24, 0.92) 100%)'
        : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
      borderBottom: `1px solid ${
        dark ? 'rgba(110, 182, 255, 0.16)' : theme.palette.divider
      }`,
      boxShadow: dark
        ? '0 4px 16px rgba(0, 0, 0, 0.28)'
        : '0 2px 10px rgba(15, 23, 42, 0.06)',
      minWidth: 0,
      overflowX: 'auto',
      overflowY: 'visible',
      width: '100%',
      zIndex: 10,
    },

    rootEmbedded: {
      flexShrink: 0,
    },

    toolbarInner: {
      alignItems: 'center',
      display: 'flex',
      flexWrap: 'wrap',
      gap: theme.spacing(0.75),
      justifyContent: 'flex-start',
      minHeight: FILTER_BAR_HEIGHT,
      minWidth: 'min-content',
      padding: theme.spacing(0.75, 1.25),
      width: '100%',
    },

    group: {
      alignItems: 'center',
      background: dark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)',
      border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'}`,
      borderRadius: 999,
      display: 'flex',
      flex: '0 1 auto',
      flexWrap: 'wrap',
      gap: theme.spacing(0.5),
      maxWidth: '100%',
      padding: theme.spacing(0.35, 0.5),
    },

    chip: {
      ...chipBase,
      backgroundColor: dark ? 'rgba(255, 255, 255, 0.06)' : theme.palette.common.white,
      border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider}`,
      color: dark ? 'rgba(255, 255, 255, 0.82)' : theme.palette.text.primary,
      '&:hover': {
        backgroundColor: dark ? 'rgba(255, 255, 255, 0.1)' : theme.palette.grey[50],
        borderColor: dark ? 'rgba(110, 182, 255, 0.35)' : theme.palette.primary.light,
      },
    },

    chipActive: {
      ...chipBase,
      backgroundColor: dark ? 'rgba(47, 128, 237, 0.2)' : 'rgba(47, 128, 237, 0.1)',
      border: `1px solid ${dark ? 'rgba(110, 182, 255, 0.45)' : theme.palette.primary.main}`,
      boxShadow: dark ? '0 0 12px rgba(47, 128, 237, 0.18)' : 'none',
      color: dark ? '#a8d4ff' : theme.palette.primary.main,
    },

    chipWarning: {
      ...chipBase,
      backgroundColor: dark ? 'rgba(232, 179, 57, 0.14)' : 'rgba(232, 179, 57, 0.12)',
      border: `1px solid ${dark ? 'rgba(232, 179, 57, 0.4)' : Colors.warning}`,
      color: dark ? '#f0c96a' : Colors.warning,
    },

    chipError: {
      ...chipBase,
      backgroundColor: dark ? 'rgba(244, 67, 54, 0.14)' : 'rgba(244, 67, 54, 0.1)',
      border: `1px solid ${dark ? 'rgba(244, 67, 54, 0.4)' : Colors.error}`,
      color: dark ? '#ff9a8f' : Colors.error,
    },

    chipSuccess: {
      ...chipBase,
      backgroundColor: dark ? 'rgba(62, 207, 110, 0.12)' : 'rgba(62, 207, 110, 0.1)',
      border: `1px solid ${dark ? 'rgba(62, 207, 110, 0.35)' : Colors.success}`,
      color: dark ? '#8ef0b0' : Colors.success,
    },

    chipMuted: {
      ...chipBase,
      backgroundColor: dark ? 'rgba(255, 255, 255, 0.04)' : theme.palette.grey[50],
      border: `1px solid ${dark ? 'rgba(255, 255, 255, 0.08)' : theme.palette.divider}`,
      color: dark ? 'rgba(255, 255, 255, 0.55)' : theme.palette.text.secondary,
    },
  };
});

const checkStyle = { fontSize: 'inherit', marginLeft: 8 };
const check = <Check style={checkStyle} />;

const getFilterChipClass = (
  filters: UAVFilter[],
  classes: ReturnType<typeof useStyles>
): string => {
  const isFilterActive = Array.isArray(filters) && filters.length > 0;

  if (!isFilterActive) {
    return classes.chip;
  }

  switch (filters[0]) {
    case UAVFilter.WITH_WARNINGS:
    case UAVFilter.INACTIVE_ONLY:
      return classes.chipWarning;

    case UAVFilter.WITH_ERRORS:
      return classes.chipError;

    default:
      return classes.chipActive;
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
    {selected ? check : null}
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
    result.onDelete = opener;
    if (action) {
      result.onClick = action;
    }
  } else {
    result.onDelete = action ?? opener;
  }

  return result;
}

type GpsFleetSummaryProps = Readonly<{
  minSatellites?: number;
  rtkFixed: number;
  rtkFloat: number;
}>;

type SortAndFilterHeaderProps = Readonly<{
  filters: UAVFilter[];
  gpsSummary: GpsFleetSummaryProps;
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
  gpsSummary,
  layout,
  onSetFilter,
  onSetSortBy,
  onToggleSortDirection,
  sortBy,
  t,
}: SortAndFilterHeaderProps): React.JSX.Element => {
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
  const isSortActive = sortBy.key !== UAVSortKey.DEFAULT;
  const isFilterActive = Array.isArray(filters) && filters.length > 0;

  return (
    <div className={clsx(classes.root, classes.rootEmbedded)}>
      <div className={classes.toolbarInner}>
        <div className={classes.group}>
          <Chip
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            ref={sortChipRef as any}
            className={isSortActive ? classes.chipActive : classes.chip}
            deleteIcon={sortBy?.reverse ? <SortDescending /> : <SortAscending />}
            icon={<Sort fontSize='small' />}
            label={shortLabelsForUAVSortKey[sortBy.key](t)}
            size='small'
            variant='outlined'
            {...bindChip({
              state: sortPopupState,
              ref: sortChipRef.current,
              action: onToggleSortDirection,
            })}
          />
          <Menu {...bindMenu(sortPopupState)} slotProps={{ paper: menuPaperProps }}>
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
            <CheckableMenuItem
              label={t('sorting.ascending')}
              selected={!sortBy?.reverse}
              onClick={() => {
                setSortReversed(false);
              }}
            />
            <CheckableMenuItem
              label={t('sorting.descending')}
              selected={Boolean(sortBy?.reverse)}
              onClick={() => {
                setSortReversed(true);
              }}
            />
          </Menu>

          <Chip
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            ref={filterChipRef as any}
            className={getFilterChipClass(filters, classes)}
            deleteIcon={isFilterActive ? undefined : <Filter fontSize='small' />}
            icon={isFilterActive ? undefined : <Filter fontSize='small' />}
            label={
              isFilterActive
                ? filters.length > 1
                  ? t('filtering.composite')
                  : shortLabelsForUAVFilter[filters[0]!](t)
                : t('filtering.filter')
            }
            size='small'
            variant='outlined'
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
          <Menu {...bindMenu(filterPopupState)} slotProps={{ paper: menuPaperProps }}>
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

        <div className={classes.group}>
          <Chip
            className={classes.chipSuccess}
            icon={<GpsFixed fontSize='small' />}
            label={`RTK+ ${gpsSummary.rtkFixed}`}
            size='small'
            title='RTK Fixed'
            variant='outlined'
          />
          <Chip
            className={classes.chipSuccess}
            icon={<GpsFixed fontSize='small' />}
            label={`RTK ${gpsSummary.rtkFloat}`}
            size='small'
            title='RTK Float'
            variant='outlined'
          />
          <Chip
            className={classes.chipMuted}
            icon={<SatelliteAlt fontSize='small' />}
            label={
              gpsSummary.minSatellites !== undefined
                ? `GPS ${gpsSummary.minSatellites}`
                : 'GPS —'
            }
            size='small'
            title='GPS 위성 수 (최소)'
            variant='outlined'
          />
        </div>
      </div>
    </div>
  );
};

export default connect(
  (state: RootState) => ({
    filters: getUAVListFilters(state),
    gpsSummary: selectGpsFleetSummary(state),
    layout: getUAVListLayout(state),
    showMissionIds: isShowingMissionIds(state),
    sortBy: getUAVListSortPreference(state),
  }),
  {
    onSetFilter: setSingleUAVListFilter,
    onSetSortBy: setUAVListSortPreference,
    onToggleSortDirection: toggleUAVListSortDirection,
  }
)(withTranslation()(SortAndFilterHeader));
