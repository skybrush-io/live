import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Virtuoso } from 'react-virtuoso';
import { createSelectionHandlerThunk } from '~/components/helpers/lists';

import { setSelectedMissionItemIds } from '~/features/mission/actions';
import {
  getMissionItemIds,
  getSelectedMissionItemIds,
} from '~/features/mission/selectors';

import MissionOverviewListItem from './MissionOverviewListItem';

const renderMissionListItem = (index, itemId, context) => (
  <MissionOverviewListItem
    id={itemId}
    index={index + 1}
    selected={context.selection.includes(itemId)}
    onSelectItem={context.onSelectItem}
  />
);

const MissionOverviewList = ({ itemIds, onSelectItem, selectedIds }) => {
  const context = {
    selection: Array.isArray(selectedIds) ? selectedIds : [],
    onSelectItem,
  };
  return (
    <Virtuoso
      data={itemIds}
      context={context}
      itemContent={renderMissionListItem}
    />
  );
};

MissionOverviewList.propTypes = {
  itemIds: PropTypes.arrayOf(PropTypes.string),
  onSelectItem: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.string),
};

export default connect(
  // mapStateToProps
  (state) => ({
    itemIds: getMissionItemIds(state),
    selectedIds: getSelectedMissionItemIds(state),
  }),
  // mapDispatchToProps
  {
    onSelectItem: createSelectionHandlerThunk({
      getSelection: getSelectedMissionItemIds,
      setSelection: setSelectedMissionItemIds,
    }),
  }
)(MissionOverviewList);
