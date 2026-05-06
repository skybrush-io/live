import { createSelector } from '@reduxjs/toolkit';
import sortBy from 'lodash-es/sortBy';
import { orderBy } from 'natural-orderby';
import React from 'react';
import { connect } from 'react-redux';

import { MiniList, MiniListDivider } from '@skybrush/mui-components';

import { listOf } from '~/components/helpers/lists';
import { type Status, statusToPriority } from '~/components/semantics';
import { setSelectedUAVIds } from '~/features/uavs/actions';
import {
  getUAVIdList,
  getUAVIdToStateMapping,
} from '~/features/uavs/selectors';
import { abbreviateGPSFixType, getSemanticsForGPSFixType } from '~/model/enums';
import type { RootState } from '~/store/reducers';

import UAVStatusMiniListEntry from './UAVStatusMiniListEntry';

/* ************************************************************************ */

type GPSFixListItem = {
  id: string;
  label: string;
  priority: number;
  status: Status;
  uavIds: string[];
};

type GPSFixDivider = { id: '__divider' };

type GPSFixListEntry = GPSFixListItem | GPSFixDivider;

const DIVIDER: GPSFixDivider = Object.freeze({ id: '__divider' });

const isDivider = (item: GPSFixListEntry): item is GPSFixDivider =>
  item.id === '__divider';

type GPSFixStatusMiniListProps = {
  items: GPSFixListEntry[];
  onClick?: (uavIds: string[], event: React.SyntheticEvent) => void;
};

/**
 * Component-specific selector that creates the list of entries to show in the
 * GPS fix status mini list.
 */
const getListItems = createSelector(
  getUAVIdToStateMapping,
  getUAVIdList,
  (byId, order): GPSFixListEntry[] => {
    const items: Record<string, GPSFixListItem> = {};

    for (const uavId of order) {
      const uav = byId[uavId];
      if (uav?.gpsFix) {
        const gpsFixType = uav.gpsFix.type;
        const key = String(gpsFixType);
        if (items[key] === undefined) {
          const status = getSemanticsForGPSFixType(gpsFixType);
          items[key] = {
            id: key,
            label: abbreviateGPSFixType(gpsFixType) || '—',
            priority: -statusToPriority(status),
            status,
            uavIds: [uavId],
          };
        } else {
          items[key].uavIds.push(uavId);
        }
      }
    }

    for (const item of Object.values(items)) {
      item.uavIds = orderBy(item.uavIds);
    }

    const values = Object.values(items);
    if (values.length === 0) {
      return [];
    }

    return [DIVIDER, ...sortBy(values, ['priority', 'label'])];
  }
);

const GPSFixStatusMiniList = listOf<GPSFixListEntry, GPSFixStatusMiniListProps>(
  (item, props) =>
    !isDivider(item) ? (
      <UAVStatusMiniListEntry
        key={item.id}
        {...item}
        pillWidth={48}
        onClick={
          props.onClick
            ? (event: React.SyntheticEvent) => {
                event.preventDefault();
                event.stopPropagation();
                props.onClick!(item.uavIds, event);
              }
            : null
        }
      />
    ) : (
      <MiniListDivider key='__divider' />
    ),
  {
    dataProvider: 'items',
    listFactory: (
      { onClick, items, ...rest }: GPSFixStatusMiniListProps,
      children: React.ReactNode[]
    ) => React.createElement(MiniList, rest, children),
  }
);

export default connect(
  (state: RootState) => ({
    items: getListItems(state),
  }),
  {
    onClick: (ids: string[]) => setSelectedUAVIds(ids),
  }
)(GPSFixStatusMiniList);
