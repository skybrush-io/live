import isEmpty from 'lodash-es/isEmpty';
import partial from 'lodash-es/partial';
import sortBy from 'lodash-es/sortBy';
import unary from 'lodash-es/unary';
import { orderBy } from 'natural-orderby';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

import MiniList from '@skybrush/mui-components/lib/MiniList';
import MiniListDivider from '@skybrush/mui-components/lib/MiniListDivider';

import { listOf } from '~/components/helpers/lists';
import { statusToPriority } from '~/components/semantics';
import { setSelectedUAVIds } from '~/features/uavs/actions';
import {
  getUAVIdToStateMapping,
  getUAVIdList,
} from '~/features/uavs/selectors';
import { abbreviateGPSFixType, getSemanticsForGPSFixType } from '~/model/enums';

import UAVStatusMiniListEntry from './UAVStatusMiniListEntry';

/* ************************************************************************ */

/**
 * Component-specific selector that creates the list of entries to show in the
 * GPS fix status mini list.
 */
const getListItems = createSelector(
  getUAVIdToStateMapping,
  getUAVIdList,
  (byId, order) => {
    const items = {};

    for (const uavId of order) {
      const uav = byId[uavId];
      if (uav && uav.gpsFix) {
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

    if (isEmpty(items)) {
      return [];
    } else {
      return [null, ...sortBy(items, ['priority', 'label'])];
    }
  }
);

const GPSFixStatusMiniList = listOf(
  (item, props) =>
    item ? (
      <UAVStatusMiniListEntry
        key={item.id}
        {...item}
        pillWidth={48}
        onClick={
          props.onClick
            ? (event) => {
                event.preventDefault();
                event.stopPropagation();
                props.onClick(item?.uavIds, event);
              }
            : null
        }
      />
    ) : (
      <MiniListDivider key='__divider' />
    ),
  {
    dataProvider: 'items',
    listFactory: partial(React.createElement, MiniList),
  }
);

export default connect(
  (state) => ({
    items: getListItems(state),
  }),
  {
    onClick: unary(setSelectedUAVIds),
  }
)(GPSFixStatusMiniList);
