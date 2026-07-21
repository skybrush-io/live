import PropTypes from 'prop-types';
import { useCallback, useEffect, useRef } from 'react';
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

const renderMissionListItem = (
  _index,
  // Item
  { id, index },
  // Context
  {
    currentItemIndex = -1,
    currentItemRatio,
    onSelectItem,
    selectedMissionId,
    selection,
  }
) => (
  <MissionOverviewListItem
    ratio={
      // prettier-ignore
      currentItemIndex < index ? 0 : // Todo
      currentItemIndex > index ? 1 : // Done
      currentItemRatio // In progress
    }
    id={id}
    index={index}
    selected={selection.includes(id)}
    selectedMissionId={selectedMissionId}
    onSelectItem={onSelectItem}
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
    currentItemIndex,
    currentItemRatio,
    onSelectItem,
    selectedMissionId,
    selection: Array.isArray(selectedItemIds) ? selectedItemIds : [],
  };

  // FIXME: Range selection with filtering can have unexpected results.
  const filteredItemIdsWithIndices = itemIdsWithIndices.filter(
    ({ id }) =>
      selectedMissionId === undefined ||
      // TODO: This is redundant, as `getParticipantsOfMissionItemId`, and thus
      //       `getParticipantsForMissionItemIds` already handle `undefined`...
      participantsForItemIds[id] === undefined ||
      participantsForItemIds[id].includes(selectedMissionId)
  );

  const virtuosoRef = useRef(null);

  const scrollToCurrent = useCallback(
    () =>
      // Postpone the scrolling to make sure that the list is already rendered
      // and the item with the given index is available!
      // (This is required for correct behavior when e.g., restoring backups.)
      setTimeout(() => {
        virtuosoRef?.current?.scrollToIndex({
          index: filteredItemIdsWithIndices.findIndex(
            ({ id }) => id === currentItemId
          ),
          align: 'center',
          behavior: 'smooth',
        });
      }, 0),
    [currentItemId, filteredItemIdsWithIndices, virtuosoRef]
  );

  useEffect(() => {
    if (selectedMissionId !== undefined && followScroll) {
      scrollToCurrent();
    }
  }, [followScroll, scrollToCurrent, selectedMissionId]);

  return (
    <Virtuoso
      ref={virtuosoRef}
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
  (state) => {
    const selectedMissionId = getSelectedMissionIdInMissionEditorPanel(state);
    return {
      currentItemId: getCurrentMissionItemIdForMissionIndex(
        state,
        selectedMissionId
      ),
      currentItemIndex: getCurrentMissionItemIndexForMissionIndex(
        state,
        selectedMissionId
      ),
      currentItemRatio: getCurrentMissionItemRatioForMissionIndex(
        state,
        selectedMissionId
      ),
      followScroll: shouldMissionEditorPanelFollowScroll(state),
      itemIdsWithIndices: getMissionItemIdsWithIndices(state),
      participantsForItemIds: getParticipantsForMissionItemIds(state),
      selectedItemIds: getSelectedMissionItemIds(state),
      selectedMissionId: getSelectedMissionIdInMissionEditorPanel(state),
    };
  },
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
