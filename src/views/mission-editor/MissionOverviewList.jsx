import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Virtuoso } from 'react-virtuoso';
import { createSelectionHandlerThunk } from '~/components/helpers/lists';

import { setSelectedMissionItemIds } from '~/features/mission/actions';
import {
  getCurrentMissionItemIndex,
  getCurrentMissionItemRatio,
  getMissionItemIds,
  getSelectedMissionItemIds,
} from '~/features/mission/selectors';

import MissionOverviewListItem from './MissionOverviewListItem';

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
  currentItemIndex,
  currentItemRatio,
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
  return (
    <Virtuoso
      data={itemIds}
      context={context}
      itemContent={renderMissionListItem}
    />
  );
};

MissionOverviewList.propTypes = {
  currentItemIndex: PropTypes.number,
  currentItemRatio: PropTypes.number,
  itemIds: PropTypes.arrayOf(PropTypes.string),
  onSelectItem: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.string),
};

export default connect(
  // mapStateToProps
  (state) => ({
    currentItemIndex: getCurrentMissionItemIndex(state),
    currentItemRatio: getCurrentMissionItemRatio(state),
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
