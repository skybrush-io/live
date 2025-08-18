import partial from 'lodash-es/partial';
import sortBy from 'lodash-es/sortBy';
import unary from 'lodash-es/unary';
import { orderBy } from 'natural-orderby';
import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import MiniList from '@skybrush/mui-components/lib/MiniList';

import { listOf } from '~/components/helpers/lists';
import { Status, statusToPriority } from '~/components/semantics';
import { setSelectedUAVIds } from '~/features/uavs/actions';
import {
  getInactiveUAVIds,
  getUAVIdToStateMapping,
  getUAVIdList,
  getSingleUAVStatusSummary,
  getUAVIdsMarkedAsGone,
} from '~/features/uavs/selectors';

import UAVStatusMiniListEntry from './UAVStatusMiniListEntry';

/**
 * Component-specific selector that creates the list of entries to show in the
 * UAV status mini list.
 */
const getListItems = createSelector(
  getUAVIdToStateMapping,
  getUAVIdList,
  getInactiveUAVIds,
  getUAVIdsMarkedAsGone,
  (byId, order, inactiveIds, goneIds) => {
    const items = {};

    // Add UAV IDs grouped by their status
    for (const uavId of order) {
      const uav = byId[uavId];
      if (uav) {
        const { text, textSemantics } = getSingleUAVStatusSummary(uav);
        const key = `${textSemantics}:${text}`;
        if (items[key] === undefined) {
          items[key] = {
            id: key,
            label: text,
            priority: -statusToPriority(textSemantics),
            status: textSemantics,
            uavIds: [uavId],
          };
        } else {
          items[key].uavIds.push(uavId);
        }
      }
    }

    // Add UAV IDs that are in the GONE state because a UAV may be GONE and
    // have an error code at the same time
    if (goneIds.length > 0) {
      const text = 'gone';
      const textSemantics = Status.OFF;
      const key = `${textSemantics}:${text}`;
      items[key] = {
        id: key,
        label: text,
        gone: true,
        priority: -statusToPriority(textSemantics),
        status: textSemantics,
        uavIds: goneIds,
      };
    }

    if (inactiveIds.length > 0) {
      const text = 'no telem';
      const textSemantics = Status.MISSING;
      const key = `${textSemantics}:${text}`;
      items[key] = {
        id: key,
        label: text,
        priority: -statusToPriority(textSemantics),
        status: textSemantics,
        uavIds: inactiveIds,
      };
    }

    // Sort UAV IDs in each category
    for (const item of Object.values(items)) {
      item.uavIds = orderBy(item.uavIds);
    }

    // Sort categories by priority
    return sortBy(items, ['priority', 'label']);
  }
);

const UAVStatusMiniList = listOf(
  (item, props) => (
    <UAVStatusMiniListEntry
      key={item.id}
      {...item}
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
  ),
  {
    dataProvider: 'items',
    backgroundHint: (
      <Translation>
        {(t) => <BackgroundHint text={t('UAVStatus.noConnected')} />}
      </Translation>
    ),
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
)(UAVStatusMiniList);
