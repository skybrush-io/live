import partial from 'lodash-es/partial';
import sortBy from 'lodash-es/sortBy';
import { orderBy } from 'natural-orderby';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

import Box from '@material-ui/core/Box';
import ListItem from '@material-ui/core/ListItem';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import MiniList from '@skybrush/mui-components/lib/MiniList';

import StatusPill from '~/components/StatusPill';
import { listOf } from '~/components/helpers/lists';
import { Status } from '~/components/semantics';

import { getSingleUAVStatusSummary } from '~/features/uavs/selectors';

import { formatIdsAndTruncateTrailingItems as formatUAVIds } from '~/utils/formatting';

/* ************************************************************************ */

/**
 * Component-specific selector that creates the list of entries to show in the
 * UAV status mini list.
 */
const getListItems = createSelector(
  (state) => state.uavs.byId,
  (state) => state.uavs.order,
  (byId, order) => {
    const items = {};

    for (const uavId of order) {
      const uav = byId[uavId];
      if (uav) {
        const { text, textSemantics } = getSingleUAVStatusSummary(uav);

        if (items[text] === undefined) {
          items[text] = {
            id: text,
            label: text,
            status: textSemantics,
            uavIds: [uavId],
          };
        } else {
          items[text].uavIds.push(uavId);
        }
      }
    }

    for (const item of Object.values(items)) {
      item.uavIds = orderBy(item.uavIds);
    }

    return sortBy(items, ['status', 'label']);
  }
);

/* ************************************************************************ */

const UAVStatusMiniListEntry = ({ id, label, status, uavIds }) => (
  <ListItem key={id} disableGutters>
    <Box width={80} mr={1}>
      <StatusPill status={status}>{label}</StatusPill>
    </Box>
    {formatUAVIds(uavIds, { maxCount: 6 })}
  </ListItem>
);

UAVStatusMiniListEntry.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  status: PropTypes.oneOf(Object.values(Status)),
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

const UAVStatusMiniList = listOf(UAVStatusMiniListEntry, {
  dataProvider: 'items',
  backgroundHint: (
    <BackgroundHint text='There are no connected UAVs at the moment' />
  ),
  listFactory: partial(React.createElement, MiniList),
});

export default connect(
  (state) => ({
    items: getListItems(state),
  }),
  {}
)(UAVStatusMiniList);
