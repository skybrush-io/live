import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Virtuoso } from 'react-virtuoso';

import { createSelectionHandlerThunk } from '~/components/helpers/lists';

import { setSelectedMissionItemIds } from '~/features/mission/actions';
import {
  getCurrentMissionItemIndex,
  getCurrentMissionItemRatio,
  getMissionItemIds,
  getSelectedMissionItemIds,
  shouldMissionEditorPanelFollowScroll,
} from '~/features/mission/selectors';
import { setEditorPanelFollowScroll } from '~/features/mission/slice';

import MissionOverviewListItem from './MissionOverviewListItem';
import { getTakeoffGridProperties } from '~/features/map/tools';

const renderMissionListItem = (index, itemId, context) => (
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
    id={itemId}
    index={index + 1}
    selected={context.selection.includes(itemId)}
    onSelectItem={context.onSelectItem}
  />
);

const MissionOverviewList = ({
  takeoffGridProperties,
  currentItemIndex,
  currentItemRatio,
  followScroll,
  itemIds,
  onSelectItem,
  selectedIds,
}) => {
  const context = {
    currentItemIndex,
    currentItemRatio,
    selection: Array.isArray(selectedIds) ? selectedIds : [],
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

  return (
    <div style={{ whiteSpace: 'pre' }}>
      {JSON.stringify(takeoffGridProperties, null, 2)}
    </div>
  );

  return (
    <Virtuoso
      ref={virtuoso}
      data={itemIds}
      context={context}
      itemContent={renderMissionListItem}
    />
  );
};

MissionOverviewList.propTypes = {
  currentItemIndex: PropTypes.number,
  currentItemRatio: PropTypes.number,
  followScroll: PropTypes.bool,
  itemIds: PropTypes.arrayOf(PropTypes.string),
  onSelectItem: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.string),
};

export default connect(
  // mapStateToProps
  (state) => ({
    takeoffGridProperties: getTakeoffGridProperties(state),
    currentItemIndex: getCurrentMissionItemIndex(state),
    currentItemRatio: getCurrentMissionItemRatio(state),
    followScroll: shouldMissionEditorPanelFollowScroll(state),
    itemIds: getMissionItemIds(state),
    selectedIds: getSelectedMissionItemIds(state),
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
