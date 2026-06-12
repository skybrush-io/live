import type { Theme } from '@mui/material/styles';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import { isThemeDark, makeStyles, monospacedFont } from '@skybrush/app-theme-mui';

import {
  setUAVListSortPreference,
  toggleUAVListSortDirection,
} from '~/features/settings/actions';
import {
  getUAVListSortPreference,
  isShowingMissionIds,
} from '~/features/settings/selectors';
import type { UAVSortKeyAndOrder } from '~/features/settings/types';
import { UAVSortKey } from '~/model/sorting';
import type { RootState } from '~/store/reducers';

import { HEADER_HEIGHT } from './constants';
import {
  LIST_ID_COLUMNS,
  listDataColumnStyle,
  listIdColumnStyle,
} from './listColumnLayout';

type HeaderPart = {
  sortKey?: UAVSortKey;
  label: string;
  style: React.CSSProperties;
};

const COMMON_HEADER_TEXT_PARTS: readonly HeaderPart[] = Object.freeze([
  {
    label: 'Status',
    sortKey: UAVSortKey.STATUS,
    style: { ...listDataColumnStyle('status'), textAlign: 'center' },
  },
  {
    label: 'Alert',
    style: { ...listDataColumnStyle('alert'), textAlign: 'center' },
  },
  {
    label: 'Mode',
    sortKey: UAVSortKey.FLIGHT_MODE,
    style: { ...listDataColumnStyle('mode'), textAlign: 'center' },
  },
  {
    label: 'Battery',
    sortKey: UAVSortKey.BATTERY,
    style: { ...listDataColumnStyle('battery'), textAlign: 'right' },
  },
  {
    label: '',
    style: { ...listDataColumnStyle('led'), textAlign: 'center' },
  },
  {
    label: 'RSSI',
    sortKey: UAVSortKey.RSSI,
    style: { ...listDataColumnStyle('rssi'), textAlign: 'center' },
  },
  {
    label: 'GPS',
    sortKey: UAVSortKey.GPS_FIX,
    style: { ...listDataColumnStyle('gps'), textAlign: 'center' },
  },
  {
    label: 'Sats',
    style: { ...listDataColumnStyle('sats'), textAlign: 'center' },
  },
  {
    label: 'Path',
    style: { ...listDataColumnStyle('path'), textAlign: 'center' },
  },
  {
    label: 'Position',
    style: { ...listDataColumnStyle('position'), textAlign: 'left' },
  },
  {
    label: 'AMSL',
    sortKey: UAVSortKey.ALTITUDE_MSL,
    style: { ...listDataColumnStyle('amsl'), textAlign: 'right' },
  },
  {
    label: 'AHL',
    sortKey: UAVSortKey.ALTITUDE_HOME,
    style: { ...listDataColumnStyle('ahl'), textAlign: 'right' },
  },
  {
    label: 'AGL',
    sortKey: UAVSortKey.ALTITUDE_GROUND,
    style: { ...listDataColumnStyle('agl'), textAlign: 'right' },
  },
  {
    label: 'Hdg',
    sortKey: UAVSortKey.HEADING,
    style: { ...listDataColumnStyle('heading'), textAlign: 'center' },
  },
  {
    label: 'Details',
    style: {
      flex: 1,
      minWidth: 0,
      textAlign: 'left',
    },
  },
]);

type HeaderTextParts = {
  missionIds: HeaderPart[];
  droneIds: HeaderPart[];
};

const HEADER_TEXT_PARTS: HeaderTextParts = {
  missionIds: [
    {
      label: 'sID',
      sortKey: UAVSortKey.DEFAULT,
      style: listIdColumnStyle(LIST_ID_COLUMNS.missionIds.primary),
    },
    {
      label: 'ID',
      sortKey: UAVSortKey.DEFAULT,
      style: listIdColumnStyle(LIST_ID_COLUMNS.missionIds.secondary),
    },
    ...COMMON_HEADER_TEXT_PARTS,
  ],
  droneIds: [
    {
      label: 'ID',
      sortKey: UAVSortKey.DEFAULT,
      style: listIdColumnStyle(LIST_ID_COLUMNS.droneIds.primary),
    },
    {
      label: 'sID',
      sortKey: UAVSortKey.DEFAULT,
      style: listIdColumnStyle(LIST_ID_COLUMNS.droneIds.secondary),
    },
    ...COMMON_HEADER_TEXT_PARTS,
  ],
};

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    alignItems: 'stretch',
    background: isThemeDark(theme)
      ? 'linear-gradient(180deg, rgba(22, 27, 34, 0.98) 0%, rgba(18, 21, 26, 0.95) 100%)'
      : theme.palette.grey[100],
    borderBottom: `1px solid ${
      isThemeDark(theme) ? 'rgba(110, 182, 255, 0.22)' : theme.palette.divider
    }`,
    color: isThemeDark(theme)
      ? 'rgba(255, 255, 255, 0.72)'
      : theme.palette.text.secondary,
    cursor: 'default',
    display: 'flex',
    flexWrap: 'nowrap',
    fontFamily: monospacedFont,
    fontSize: '0.68rem',
    fontWeight: 700,
    height: HEADER_HEIGHT,
    letterSpacing: '0.08em',
    overflow: 'hidden',
    textTransform: 'uppercase',
    userSelect: 'none',
    whiteSpace: 'pre',
    width: '100%',
  },

  sortable: {
    cursor: 'pointer',
    transition: theme.transitions.create(['background-color', 'color'], {
      duration: theme.transitions.duration.short,
    }),
    '&:hover': {
      backgroundColor: isThemeDark(theme)
        ? 'rgba(110, 182, 255, 0.1)'
        : theme.palette.action.hover,
      color: isThemeDark(theme)
        ? 'rgba(255, 255, 255, 0.95)'
        : theme.palette.text.primary,
    },
  },

  sortActive: {
    color: isThemeDark(theme) ? '#8ec8ff' : theme.palette.primary.main,
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
  },
}));

type UAVListColumnHeaderRowPresentationProps = Readonly<{
  onSetSortBy: (sortBy: Partial<UAVSortKeyAndOrder>) => void;
  onToggleSortDirection: () => void;
  showMissionIds?: boolean;
  sortBy: UAVSortKeyAndOrder;
}>;

const UAVListColumnHeaderRowPresentation = ({
  onSetSortBy,
  onToggleSortDirection,
  showMissionIds = false,
  sortBy,
}: UAVListColumnHeaderRowPresentationProps): React.JSX.Element => {
  const classes = useStyles();
  const parts = showMissionIds
    ? HEADER_TEXT_PARTS.missionIds
    : HEADER_TEXT_PARTS.droneIds;

  const onSortColumn = useCallback(
    (key: UAVSortKey) => {
      if (sortBy.key === key) {
        onToggleSortDirection();
      } else {
        onSetSortBy({ key });
      }
    },
    [onSetSortBy, onToggleSortDirection, sortBy.key]
  );

  return (
    <div className={classes.root} role='row'>
      {parts.map(({ label, sortKey, style }) => (
        <div
          key={label || 'led'}
          className={clsx(
            sortKey && classes.sortable,
            sortKey && sortBy.key === sortKey && classes.sortActive
          )}
          role='columnheader'
          style={style}
          onClick={sortKey ? (): void => onSortColumn(sortKey) : undefined}
        >
          {label}
        </div>
      ))}
    </div>
  );
};

export default connect(
  (state: RootState) => ({
    showMissionIds: isShowingMissionIds(state),
    sortBy: getUAVListSortPreference(state),
  }),
  {
    onSetSortBy: setUAVListSortPreference,
    onToggleSortDirection: toggleUAVListSortDirection,
  }
)(UAVListColumnHeaderRowPresentation);
