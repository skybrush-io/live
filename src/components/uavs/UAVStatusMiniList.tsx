import { createSelector } from '@reduxjs/toolkit';
import sortBy from 'lodash-es/sortBy';
import unary from 'lodash-es/unary';
import { orderBy } from 'natural-orderby';
import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import { BackgroundHint, MiniList } from '@skybrush/mui-components';

import { listOf } from '~/components/helpers/lists';
import { Status, statusToPriority } from '~/components/semantics';
import { setSelectedUAVIds } from '~/features/uavs/actions';
import {
  getInactiveUAVIds,
  getSingleUAVStatusSummary,
  getUAVIdList,
  getUAVIdsMarkedAsGone,
  getUAVIdToStateMapping,
} from '~/features/uavs/selectors';
import type { RootState } from '~/store/reducers';

import UAVStatusMiniListEntry from './UAVStatusMiniListEntry';

type UAVStatusMiniListItem = {
  gone?: boolean;
  id: string;
  label: string;
  priority: number;
  status: Status;
  uavIds: string[];
};

type UAVStatusMiniListProps = {
  items: UAVStatusMiniListItem[];
  onClick?: (uavIds: string[]) => void;
} & React.RefAttributes<HTMLUListElement>;

/**
 * Component-specific selector that creates the list of entries to show in the
 * UAV status mini list.
 */
const getListItems = createSelector(
  getUAVIdToStateMapping,
  getUAVIdList,
  getInactiveUAVIds,
  getUAVIdsMarkedAsGone,
  (byId, order, inactiveIds, goneIds): UAVStatusMiniListItem[] => {
    const items: Record<string, UAVStatusMiniListItem> = {};

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
    return sortBy(Object.values(items), ['priority', 'label']);
  }
);

const UAVStatusMiniList = listOf<UAVStatusMiniListItem, UAVStatusMiniListProps>(
  (item, { onClick }) => (
    <UAVStatusMiniListEntry
      key={item.id}
      {...item}
      onClick={
        onClick
          ? (event: React.SyntheticEvent) => {
              event.preventDefault();
              event.stopPropagation();
              onClick(item.uavIds);
            }
          : undefined
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
    listFactory: (
      { onClick, items, ...rest }: UAVStatusMiniListProps,
      children: React.ReactNode[]
    ) => React.createElement(MiniList, rest, children),
  }
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    items: getListItems(state),
  }),
  // mapDispatchToProps
  {
    onClick: unary(setSelectedUAVIds),
  }
)(UAVStatusMiniList);
