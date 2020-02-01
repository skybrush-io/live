/**
 * @file Component that displays the status of the known UAVs in a Skybrush
 * flock.
 */

import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { connect } from 'react-redux';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import ListSubheader from '@material-ui/core/ListSubheader';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Delete from '@material-ui/icons/Delete';
import { createSelector } from '@reduxjs/toolkit';

import DroneAvatar from './DroneAvatar';
import DroneListItem from './DroneListItem';
import DronePlaceholder from './DronePlaceholder';

import { setSelectedUAVIds } from '~/actions/map';
import { createSelectionHandlerFactory } from '~/components/helpers/lists';
import { adjustMissionMapping } from '~/features/mission/slice';
import {
  getMissionMapping,
  isMappingEditable
} from '~/features/mission/selectors';
import { isShowingMissionIds } from '~/features/settings/selectors';
import { getUAVIdList } from '~/features/uavs/selectors';
import useDarkMode from '~/hooks/useDarkMode';
import { getSelectedUAVIds } from '~/selectors/selection';
import UAVToolbar from '~/views/uavs/UAVToolbar';

const drones = [
  {
    id: '1',
    progress: 30,
    status: 'success',
    secondaryStatus: 'off',
    text: 'Armed',
    textSemantics: 'success'
  },
  {
    id: '2',
    crossed: true,
    status: 'rth'
  },
  {
    id: '3',
    status: 'warning'
  },
  {
    id: '4',
    status: 'error'
  },
  {
    id: '5',
    status: 'critical'
  }
];

const useStyles = makeStyles(
  theme => ({
    root: {
      backgroundColor: theme.palette.background.paper
    },
    rootDark: {
      backgroundColor: '#444'
    }
  }),
  { name: 'UAVList' }
);

/**
 * Helper function to show a list of drone avatars and placeholders.
 */
const createListItems = (
  items,
  { draggable, onDropped, onSelected, selectedUAVIds }
) =>
  items.map(([uavId, missionIndex, label]) =>
    uavId === undefined ? (
      <DroneListItem
        key={`placeholder-${label}`}
        onDrop={onDropped ? onDropped(missionIndex) : undefined}
      >
        <DronePlaceholder label={label} />
      </DroneListItem>
    ) : (
      <DroneListItem
        key={uavId}
        draggable={draggable}
        selected={selectedUAVIds.includes(uavId)}
        uavId={uavId}
        onClick={onSelected(uavId)}
        onDrop={onDropped ? onDropped(missionIndex) : undefined}
      >
        <DroneAvatar
          key={uavId}
          id={uavId}
          label={label}
          selected={selectedUAVIds.includes(uavId)}
        />
      </DroneListItem>
    )
  );

/**
 * Presentation component for showing the drone show configuration view.
 */
const UAVListPresentation = ({
  editingMapping,
  onMappingAdjusted,
  onSelectionChanged,
  selectedUAVIds,
  uavIds
}) => {
  const classes = useStyles();
  const darkMode = useDarkMode();
  const onSelected = useMemo(
    () =>
      createSelectionHandlerFactory({
        getSelection: () => selectedUAVIds,
        setSelection: onSelectionChanged
      }),
    [selectedUAVIds, onSelectionChanged]
  );
  const onDropped = useMemo(
    () => targetIndex => droppedUAVId => {
      onMappingAdjusted({
        uavId: droppedUAVId,
        to: targetIndex
      });
    },
    [onMappingAdjusted]
  );
  const { mainUAVIds, spareUAVIds } = uavIds;

  const listItemProps = {
    draggable: editingMapping,
    onDropped: editingMapping && onDropped,
    onSelected,
    selectedUAVIds
  };

  const mainBox = (
    <Box display="flex" flexDirection="column">
      <AppBar
        color="default"
        position="static"
        className={darkMode ? classes.rootDark : classes.root}
      >
        <UAVToolbar flex={0} selectedUAVIds={selectedUAVIds} />
      </AppBar>
      <Box flex={1}>
        <Box display="flex" flexDirection="row" flexWrap="wrap">
          {createListItems(mainUAVIds, listItemProps)}
        </Box>
        {spareUAVIds.length > 0 || editingMapping ? (
          <>
            <ListSubheader key="__spare" flex="0 0 100%">
              Spare UAVs
            </ListSubheader>
            <Box display="flex" flexDirection="row" flexWrap="wrap">
              {createListItems(spareUAVIds, listItemProps)}
            </Box>
          </>
        ) : null}
      </Box>
    </Box>
  );

  return editingMapping ? (
    <DndProvider backend={HTML5Backend}>{mainBox}</DndProvider>
  ) : (
    mainBox
  );
};

UAVListPresentation.propTypes = {
  editingMapping: PropTypes.bool,
  onMappingAdjusted: PropTypes.func,
  onSelectionChanged: PropTypes.func,
  selectedUAVIds: PropTypes.array,
  uavIds: PropTypes.exact({
    mainUAVIds: PropTypes.arrayOf(PropTypes.array).isRequired,
    spareUAVIds: PropTypes.arrayOf(PropTypes.array).isRequired
  }).isRequired
};

/**
 * Selector that provides the list of UAV IDs to show in the UAV list when we
 * are using the UAV IDs without their mission-specific identifiers.
 *
 * The main section of the view will be sorted based on the UAV IDs in the
 * state store. The "spare UAVs" section in the view will be empty.
 */
const getDisplayedUAVIdList = createSelector(
  getUAVIdList,
  uavIds => ({
    mainUAVIds: uavIds.map(uavId => [uavId, undefined, uavId]),
    spareUAVIds: []
  })
);

const getDisplayedMissionIdList = createSelector(
  getMissionMapping,
  isMappingEditable,
  getUAVIdList,
  (mapping, editable, uavIds) => {
    const mainUAVIds = [];
    const spareUAVIds = [];
    const seenUAVIds = new Set();

    mapping.forEach((uavId, index) => {
      const missionId = `s${index}`;
      if (isNil(uavId)) {
        // No UAV assigned to this slot
        mainUAVIds.push([undefined, index, missionId]);
      } else {
        // Some UAV is assigned to this slot. If we are not editing the
        // mapping, we show the mission ID. Otherwise we show the UAV ID.
        mainUAVIds.push([uavId, index, editable ? uavId : missionId]);
        seenUAVIds.add(uavId);
      }
    });

    for (const uavId of uavIds) {
      if (!seenUAVIds.has(uavId)) {
        // This UAV is not part of the current mapping.
        spareUAVIds.push([uavId, undefined, uavId]);
      }
    }

    // If we are in editing mode, we always add one extra spare UAV slot
    // where the user can drag UAVs that should be deleted
    if (editable) {
      spareUAVIds.push([undefined, undefined, <Delete key="__delete" />]);
    }

    return { mainUAVIds, spareUAVIds };
  }
);

const getDisplayedIdList = state =>
  isShowingMissionIds(state)
    ? getDisplayedMissionIdList(state)
    : getDisplayedUAVIdList(state);

/**
 * Smart component for showing the drone show configuration view.
 */
const UAVList = connect(
  // mapStateToProps
  state => ({
    editingMapping: isMappingEditable(state),
    selectedUAVIds: getSelectedUAVIds(state),
    uavIds: getDisplayedIdList(state)
  }),
  // mapDispatchToProps
  {
    onMappingAdjusted: adjustMissionMapping,
    onSelectionChanged: setSelectedUAVIds
  }
)(UAVListPresentation);

export default UAVList;
