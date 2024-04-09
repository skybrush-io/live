import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Virtuoso } from 'react-virtuoso';

import { createSelectionHandlerThunk } from '~/components/helpers/lists';

import { setSelectedMissionItemIds } from '~/features/mission/actions';
import {
  getCurrentMissionItemIndex,
  getCurrentMissionItemRatio,
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
    done={index < context.currentItemIndex}
    // prettier-ignore
    ratio={
      // The item is done
      index < context.currentItemIndex ? 1 :
      // The item is in progress
      index === context.currentItemIndex ? context.currentItemRatio :
      // The item is to be done
      0
    }
    id={id}
    index={index + 1}
    selected={context.selection.includes(id)}
    onSelectItem={context.onSelectItem}
  />
);

const MissionOverviewList = ({
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
    currentItemIndex,
    currentItemRatio,
    selection: Array.isArray(selectedItemIds) ? selectedItemIds : [],
    onSelectItem,
  };

  const virtuoso = useRef(null);

  const scrollToCurrent = useCallback(
    () =>
      // Postpone the scrolling to make sure that the list is already rendered
      // and the item with the given index is available!
      // (This is required for correct behavior when e.g., restoring backups.)
      setTimeout(() => {
        virtuoso.current.scrollToIndex({
          index: currentItemIndex,
          align: 'center',
          behavior: 'smooth',
        });
      }, 0),
    [currentItemIndex, virtuoso]
  );

  useEffect(() => {
    if (followScroll) {
      scrollToCurrent();
    }
  }, [followScroll, scrollToCurrent]);

  const filteredItemIds = itemIdsWithIndices.filter(
    ({ id }) =>
      selectedMissionId === undefined ||
      participantsForItemIds[id] === undefined ||
      participantsForItemIds[id].includes(selectedMissionId)
  );

  return (
    <Virtuoso
      ref={virtuoso}
      data={filteredItemIds}
      context={context}
      itemContent={renderMissionListItem}
    />
  );
};

MissionOverviewList.propTypes = {
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
    currentItemIndex: getCurrentMissionItemIndex(state),
    currentItemRatio: getCurrentMissionItemRatio(state),
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
