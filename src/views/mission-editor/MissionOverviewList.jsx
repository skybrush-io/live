import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Virtuoso } from 'react-virtuoso';

import { createSelectionHandlerThunk } from '~/components/helpers/lists';

import { setSelectedMissionItemIds } from '~/features/mission/actions';
import {
  getCurrentMissionItemIdForMissionIndex,
  getCurrentMissionItemIndexForMissionIndex,
  getCurrentMissionItemRatioForMissionIndex,
  getMissionItemIds,
  getMissionItemIdsWithIndices,
  getParticipantsForMissionItemIds,
  getSelectedMissionIdInMissionEditorPanel,
  getSelectedMissionItemIds,
  shouldMissionEditorPanelFollowScroll,
} from '~/features/mission/selectors';
import { setEditorPanelFollowScroll } from '~/features/mission/slice';

import MissionOverviewListItem from './MissionOverviewListItem';

const renderMissionListItem = (_index, { id, index }, context) => (
  <MissionOverviewListItem
    ratio={
      // prettier-ignore
      context.currentItemIndex < index ? 0 : // Todo
      index < context.currentItemIndex ? 1 : // Done
      context.currentItemRatio // In progress
    }
    id={id}
    index={index}
    selected={context.selection.includes(id)}
    selectedMissionId={context.selectedMissionId}
    onSelectItem={context.onSelectItem}
  />
);

const MissionOverviewList = ({
  currentItemId,
  currentItemIndex,
  currentItemRatio,
  followScroll,
  itemIdsWithIndices,
  onSelectItem,
  participantsForItemIds,
  selectedItemIds,
  selectedMissionId,
}) => {
  const context = {
    selectedMissionId,
    currentItemIndex,
    currentItemRatio,
    selection: Array.isArray(selectedItemIds) ? selectedItemIds : [],
    onSelectItem,
  };

  const filteredItemIdsWithIndices = itemIdsWithIndices.filter(
    ({ id }) =>
      selectedMissionId === undefined ||
      participantsForItemIds[id].includes(selectedMissionId)
  );

  const virtuoso = useRef(null);

  const scrollToCurrent = useCallback(
    () =>
      // Postpone the scrolling to make sure that the list is already rendered
      // and the item with the given index is available!
      // (This is required for correct behavior when e.g., restoring backups.)
      setTimeout(() => {
        virtuoso?.current?.scrollToIndex({
          index: filteredItemIdsWithIndices.findIndex(
            ({ id }) => id === currentItemId
          ),
          align: 'center',
          behavior: 'smooth',
        });
      }, 0),
    [currentItemId, filteredItemIdsWithIndices, virtuoso]
  );

  useEffect(() => {
    if (selectedMissionId !== undefined && followScroll) {
      scrollToCurrent();
    }
  }, [followScroll, scrollToCurrent, selectedMissionId]);

  return (
    <Virtuoso
      ref={virtuoso}
      data={filteredItemIdsWithIndices}
      context={context}
      itemContent={renderMissionListItem}
    />
  );
};

MissionOverviewList.propTypes = {
  currentItemId: PropTypes.string,
  currentItemIndex: PropTypes.number,
  currentItemRatio: PropTypes.number,
  followScroll: PropTypes.bool,
  itemIdsWithIndices: PropTypes.arrayOf(PropTypes.object),
  onSelectItem: PropTypes.func,
  participantsForItemIds: PropTypes.object,
  selectedItemIds: PropTypes.arrayOf(PropTypes.string),
  selectedMissionId: PropTypes.number,
};

export default connect(
  // mapStateToProps
  (state) => ({
    currentItemId: getCurrentMissionItemIdForMissionIndex(
      state,
      getSelectedMissionIdInMissionEditorPanel(state)
    ),
    currentItemIndex: getCurrentMissionItemIndexForMissionIndex(
      state,
      getSelectedMissionIdInMissionEditorPanel(state)
    ),
    currentItemRatio: getCurrentMissionItemRatioForMissionIndex(
      state,
      getSelectedMissionIdInMissionEditorPanel(state)
    ),
    followScroll: shouldMissionEditorPanelFollowScroll(state),
    itemIdsWithIndices: getMissionItemIdsWithIndices(state),
    participantsForItemIds: getParticipantsForMissionItemIds(state),
    selectedItemIds: getSelectedMissionItemIds(state),
    selectedMissionId: getSelectedMissionIdInMissionEditorPanel(state),
  }),
  // mapDispatchToProps
  {
    onFollowScrollChanged: setEditorPanelFollowScroll,
    onSelectItem: createSelectionHandlerThunk({
      getSelection: getSelectedMissionItemIds,
      setSelection: setSelectedMissionItemIds,
      getListItems: getMissionItemIds,
    }),
  }
)(MissionOverviewList);
