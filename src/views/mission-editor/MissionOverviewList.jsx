import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { Virtuoso } from 'react-virtuoso';

import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { makeStyles } from '@material-ui/core/styles';

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

const useStyles = makeStyles(
  (theme) => ({
    autoScroll: {
      position: 'absolute',
      right: 0,

      zIndex: 1,

      marginRight: 0,
      paddingRight: 6,
      borderBottomLeftRadius: 10,

      background: theme.palette.action.hover,
    },

    autoScrollCheckbox: {
      padding: 6,
    },
  }),
  {
    name: 'MissionOverviewListItem',
  }
);

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
  followScroll,
  itemIds,
  onFollowScrollChanged,
  onSelectItem,
  selectedIds,
}) => {
  const classes = useStyles();
  const context = {
    currentItemIndex,
    currentItemRatio,
    selection: Array.isArray(selectedIds) ? selectedIds : [],
    onSelectItem,
  };

  const virtuoso = useRef(null);

  const scrollToCurrent = useCallback(
    () =>
      virtuoso.current.scrollToIndex({
        index: currentItemIndex,
        align: 'center',
        behavior: 'smooth',
      }),
    [currentItemIndex, virtuoso]
  );

  const toggleFollowScroll = useCallback(
    (event) => {
      onFollowScrollChanged(event.target.checked);
      if (event.target.checked) {
        scrollToCurrent();
      }
    },
    [onFollowScrollChanged, scrollToCurrent]
  );

  useEffect(() => {
    if (followScroll) {
      scrollToCurrent();
    }
  }, [followScroll, scrollToCurrent]);

  return (
    <Box height='100%'>
      <FormControlLabel
        className={classes.autoScroll}
        control={
          <Checkbox
            className={classes.autoScrollCheckbox}
            size='small'
            checked={followScroll}
            onChange={toggleFollowScroll}
          />
        }
        label='Follow'
      />
      <Virtuoso
        ref={virtuoso}
        data={itemIds}
        context={context}
        itemContent={renderMissionListItem}
      />
    </Box>
  );
};

MissionOverviewList.propTypes = {
  currentItemIndex: PropTypes.number,
  currentItemRatio: PropTypes.number,
  followScroll: PropTypes.bool,
  itemIds: PropTypes.arrayOf(PropTypes.string),
  onSelectItem: PropTypes.func,
  onFollowScrollChanged: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.string),
};

export default connect(
  // mapStateToProps
  (state) => ({
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
    }),
  }
)(MissionOverviewList);
