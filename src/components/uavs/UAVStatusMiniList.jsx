import partial from 'lodash-es/partial';
import sortBy from 'lodash-es/sortBy';
import unary from 'lodash-es/unary';
import { orderBy } from 'natural-orderby';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';

import Box from '@material-ui/core/Box';
import ListItem from '@material-ui/core/ListItem';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import MiniList from '@skybrush/mui-components/lib/MiniList';

import { setSelectedUAVIds } from '~/actions/map';
import { listOf } from '~/components/helpers/lists';
import { Status, statusToPriority } from '~/components/semantics';
import StatusPill from '~/components/StatusPill';

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

    for (const item of Object.values(items)) {
      item.uavIds = orderBy(item.uavIds);
    }

    return sortBy(items, ['priority', 'label']);
  }
);

/* ************************************************************************ */

const UAVStatusMiniListEntry = ({ id, label, onClick, status, uavIds }) => (
  <ListItem key={id} button disableGutters onClick={onClick}>
    <Box width={80} mr={1}>
      <StatusPill status={status}>{label}</StatusPill>
    </Box>
    <Box width={32} mr={1}>
      <StatusPill status={Status.OFF}>{uavIds.length}</StatusPill>
    </Box>
    {formatUAVIds(uavIds, { maxCount: 6 })}
  </ListItem>
);

UAVStatusMiniListEntry.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func,
  status: PropTypes.oneOf(Object.values(Status)),
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

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
      <BackgroundHint text='There are no connected UAVs at the moment' />
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
