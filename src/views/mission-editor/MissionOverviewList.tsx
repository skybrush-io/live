import { type MouseEvent, useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';

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
import type { RootState } from '~/store/reducers';

import MissionOverviewListItem from './MissionOverviewListItem';

type ItemData = {
  id: string;
  index: number;
};

type ListContext = {
  currentItemIndex: number | undefined;
  currentItemRatio: number | undefined;
  onSelectItem: (id: string, event: MouseEvent) => void;
  selectedMissionId: number | undefined;
  selection: readonly string[];
};

const renderMissionListItem = (
  _index: number,
  { id, index }: ItemData,
  {
    currentItemIndex = -1,
    currentItemRatio,
    onSelectItem,
    selectedMissionId,
    selection,
  }: ListContext
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

type OwnProps = {
  followScroll?: boolean;
};

type StateProps = {
  currentItemId: string | undefined;
  currentItemIndex: number | undefined;
  currentItemRatio: number | undefined;
  followScroll: boolean;
  itemIdsWithIndices: Array<{ id: string; index: number }>;
  participantsForItemIds: Record<string, number[]>;
  selectedItemIds: string[];
  selectedMissionId: number | undefined;
};

type DispatchProps = {
  onFollowScrollChanged: (payload: boolean) => void;
  onSelectItem: (id: string, event: MouseEvent) => void;
};

type Props = OwnProps & StateProps & DispatchProps;

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
}: Props) => {
  const context: ListContext = {
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

  const virtuosoRef = useRef<VirtuosoHandle>(null);

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
    <Virtuoso<ItemData, ListContext>
      ref={virtuosoRef}
      data={filteredItemIdsWithIndices}
      context={context}
      itemContent={renderMissionListItem}
    />
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => {
    const selectedMissionId = getSelectedMissionIdInMissionEditorPanel(state);
    return {
      currentItemId:
        selectedMissionId !== undefined
          ? getCurrentMissionItemIdForMissionIndex(state, selectedMissionId)
          : undefined,
      currentItemIndex:
        selectedMissionId !== undefined
          ? getCurrentMissionItemIndexForMissionIndex(state, selectedMissionId)
          : undefined,
      currentItemRatio:
        selectedMissionId !== undefined
          ? getCurrentMissionItemRatioForMissionIndex(state, selectedMissionId)
          : undefined,
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
    // `createSelectionHandlerThunk` returns a function with an unused event parameter;
    // cast to the simpler signature expected by MissionOverviewListItem
    onSelectItem: createSelectionHandlerThunk({
      getSelection: getSelectedMissionItemIds,
      setSelection: setSelectedMissionItemIds,
      getListItems: getMissionItemIds,
    }),
  }
)(MissionOverviewList);
