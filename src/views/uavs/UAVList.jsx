/**
 * @file Component that displays the status of the known UAVs in a Skybrush
 * flock.
 */

import difference from 'lodash-es/difference';
import isNil from 'lodash-es/isNil';
import mapValues from 'lodash-es/mapValues';
import union from 'lodash-es/union';
import PropTypes from 'prop-types';
import React, { useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { connect } from 'react-redux';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Delete from '@material-ui/icons/Delete';
import { createSelector } from '@reduxjs/toolkit';

import DroneAvatar from './DroneAvatar';
import DroneListItem from './DroneListItem';
import MappingEditorToolbar from './MappingEditorToolbar';
import MappingSlotEditor from './MappingSlotEditor';
import MappingSlotEditorToolbar from './MappingSlotEditorToolbar';
import UAVListSubheader from './UAVListSubheader';
import UAVToolbar from './UAVToolbar';

import { setSelectedUAVIds } from '~/actions/map';
import { createSelectionHandlerFactory } from '~/components/helpers/lists';
import FadeAndSlide from '~/components/transitions/FadeAndSlide';
import DronePlaceholder from '~/components/uavs/DronePlaceholder';
import {
  adjustMissionMapping,
  startMappingEditorSessionAtSlot,
} from '~/features/mission/slice';
import {
  getIndexOfMappingSlotBeingEdited,
  getMissionMapping,
  isMappingEditable,
} from '~/features/mission/selectors';
import { isShowingMissionIds } from '~/features/settings/selectors';
import { getUAVIdList } from '~/features/uavs/selectors';
import { getSelectedUAVIds } from '~/selectors/selection';
import { isDark } from '~/theme';
import { formatMissionId } from '~/utils/formatting';

const useStyles = makeStyles(
  (theme) => ({
    appBar: {
      backgroundColor: isDark(theme) ? '#444' : theme.palette.background.paper,
      height: 48,
    },

    toolbar: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    },
  }),
  { name: 'UAVList' }
);

/**
 * Helper function to show a list of drone avatars and placeholders.
 */
const createListItems = (
  items,
  { draggable, mappingSlotBeingEdited, onDropped, onSelected, selectedUAVIds }
) =>
  items.map((item) => {
    const [uavId, missionIndex, label] = item;
    const editing =
      mappingSlotBeingEdited !== undefined &&
      missionIndex === mappingSlotBeingEdited;
    const selected = selectedUAVIds.includes(uavId);
    const listItemProps = {
      onClick: onSelected ? onSelected(uavId, missionIndex) : undefined,
      onDrop: onDropped ? onDropped(missionIndex) : undefined,
      editing,
      selected,
    };

    if (item === deletionMarker) {
      listItemProps.fill = true;
    }

    return uavId === undefined ? (
      <DroneListItem
        key={`placeholder-${label || 'null'}`}
        onDrop={onDropped ? onDropped(missionIndex) : undefined}
        {...listItemProps}
      >
        {editing && <MappingSlotEditor />}
        <DronePlaceholder
          editing={editing}
          label={editing ? '' : label}
          status={missionIndex === undefined ? 'error' : 'off'}
        />
      </DroneListItem>
    ) : (
      <DroneListItem
        key={uavId}
        draggable={draggable}
        uavId={uavId}
        {...listItemProps}
      >
        {editing && <MappingSlotEditor />}
        <DroneAvatar
          key={uavId}
          id={uavId}
          editing={editing}
          label={editing ? '' : label}
          selected={selected}
        />
      </DroneListItem>
    );
  });

/**
 * Presentation component for showing the drone show configuration view.
 */
const UAVListPresentation = ({
  editingMapping,
  mappingSlotBeingEdited,
  onEditMappingSlot,
  onMappingAdjusted,
  onSelectionChanged,
  onSelectSection,
  selectedUAVIds,
  selectionInfo,
  uavIds,
}) => {
  const classes = useStyles();

  const onUpdateSelection = useMemo(
    () =>
      createSelectionHandlerFactory({
        getSelection: () => selectedUAVIds,
        setSelection: onSelectionChanged,
      }),
    [selectedUAVIds, onSelectionChanged]
  );

  const onDropped = useCallback(
    (targetIndex) => (droppedUAVId) =>
      onMappingAdjusted({
        uavId: droppedUAVId,
        to: targetIndex,
      }),
    [onMappingAdjusted]
  );

  const onStartEditing = useCallback(
    (uavId, missionIndex) => () => onEditMappingSlot(missionIndex),
    [onEditMappingSlot]
  );

  const { mainUAVIds, spareUAVIds, extraSlots } = uavIds;

  const listItemProps = {
    draggable: editingMapping,
    mappingSlotBeingEdited,
    onDropped: editingMapping && onDropped,
    onSelected: editingMapping ? onStartEditing : onUpdateSelection,
    selectedUAVIds,
  };

  const mainBox = (
    <Box display='flex' flexDirection='column' height="100%">
      <AppBar color='default' position='static' className={classes.appBar}>
        <FadeAndSlide mountOnEnter unmountOnExit in={!editingMapping}>
          <UAVToolbar
            className={classes.toolbar}
            selectedUAVIds={selectedUAVIds}
          />
        </FadeAndSlide>
        <FadeAndSlide
          mountOnEnter
          unmountOnExit
          in={editingMapping && mappingSlotBeingEdited < 0}
        >
          <MappingEditorToolbar className={classes.toolbar} />
        </FadeAndSlide>
        <FadeAndSlide
          mountOnEnter
          unmountOnExit
          in={editingMapping && mappingSlotBeingEdited >= 0}
        >
          <MappingSlotEditorToolbar className={classes.toolbar} />
        </FadeAndSlide>
      </AppBar>
      <Box flex={1} overflow="auto">
        {mainUAVIds.length > 0 ? (
          <>
            <UAVListSubheader
              key='__main'
              label='Assigned UAVs'
              value='mainUAVIds'
              onChange={onSelectSection}
              {...selectionInfo.mainUAVIds}
            />
            <Box display='flex' flexDirection='row' flexWrap='wrap'>
              {createListItems(mainUAVIds, listItemProps)}
            </Box>
          </>
        ) : null}
        {spareUAVIds.length > 0 || editingMapping ? (
          <>
            <UAVListSubheader
              key='__spare'
              label='Spare UAVs'
              value='spareUAVIds'
              onChange={onSelectSection}
              {...selectionInfo.spareUAVIds}
            />
            <Box display='flex' flexDirection='row' flexWrap='wrap'>
              {createListItems(spareUAVIds, listItemProps)}
            </Box>
          </>
        ) : null}
      </Box>
      {extraSlots.length > 0 ? (
        <Box className='bottom-bar'>
          <Box display='flex' flexDirection='row' flexWrap='wrap'>
            {createListItems(extraSlots, listItemProps)}
          </Box>
        </Box>
      ) : null}
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
  mappingSlotBeingEdited: PropTypes.number,
  onEditMappingSlot: PropTypes.func,
  onMappingAdjusted: PropTypes.func,
  onSelectionChanged: PropTypes.func,
  onSelectSection: PropTypes.func,
  selectedUAVIds: PropTypes.array,
  selectionInfo: PropTypes.exact({
    mainUAVIds: PropTypes.exact({
      checked: PropTypes.bool,
      disabled: PropTypes.bool,
      indeterminate: PropTypes.bool,
    }),
    spareUAVIds: PropTypes.exact({
      checked: PropTypes.bool,
      disabled: PropTypes.bool,
      indeterminate: PropTypes.bool,
    }),
    extraSlots: PropTypes.exact({
      checked: PropTypes.bool,
      disabled: PropTypes.bool,
      indeterminate: PropTypes.bool
    })
  }),
  uavIds: PropTypes.exact({
    mainUAVIds: PropTypes.arrayOf(PropTypes.array).isRequired,
    spareUAVIds: PropTypes.arrayOf(PropTypes.array).isRequired,
    extraSlots: PropTypes.arrayOf(PropTypes.array).isRequired,
  }).isRequired,
};

/**
 * Special marker that we can place into the list items returned from
 * getDisplayedIdList() to produce a slot where deleted UAVs can be dragged.
 */
const deletionMarker = [undefined, undefined, <Delete key='__delete' />];

/**
 * Selector that provides the list of UAV IDs to show in the UAV list when we
 * are using the UAV IDs without their mission-specific identifiers.
 *
 * The main section of the view will be sorted based on the UAV IDs in the
 * state store. The "spare UAVs" section in the view will be empty.
 */
const getDisplayedUAVIdList = createSelector(getUAVIdList, (uavIds) => ({
  mainUAVIds: uavIds.map((uavId) => [uavId, undefined, uavId]),
  spareUAVIds: [],
  extraSlots: []
}));

/**
 * Selector that provides the list of UAV IDs to show in the UAV list when
 * we are using the mission-specific identifiers.
 *
 * The main section of the view will be sorted based on the mission-specific
 * indices. The "spare UAVs" section in the view will include all the UAVs
 * that are not currently assigned to the mission.
 */
const getDisplayedMissionIdList = createSelector(
  getMissionMapping,
  isMappingEditable,
  getUAVIdList,
  (mapping, editable, uavIds) => {
    const mainUAVIds = [];
    const spareUAVIds = [];
    const extraSlots = [];
    const seenUAVIds = new Set();

    mapping.forEach((uavId, index) => {
      const missionId = formatMissionId(index);
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

    // If we are in editing mode, we always add one extra slot where the user
    // can drag UAVs that should be deleted
    if (editable) {
      extraSlots.push(deletionMarker);
    }

    return { mainUAVIds, spareUAVIds, extraSlots };
  }
);

/**
 * Selector that provides the list of UAV IDs to show in the UAV list.
 */
const getDisplayedIdList = (state) =>
  isShowingMissionIds(state)
    ? getDisplayedMissionIdList(state)
    : getDisplayedUAVIdList(state);

/**
 * Selector that takes the displayed list of UAV IDs sorted by sections,
 * and then returns an object mapping section identifiers to two booleans:
 * one that denotes whether _all_ the items are selected in the section, and
 * one that denotes whether _some_ but not all the items are selected in the
 * section. These are assigned to keys named `checked` and `indeterminate`,
 * respectively, so they can be used directly for an UAVListSubheader
 * component.
 */
const getSelectionInfo = createSelector(
  getDisplayedIdList,
  getSelectedUAVIds,
  (displayedIdList, selectedIds) =>
    mapValues(displayedIdList, (idsAndLabels) => {
      const nonEmptyIdsAndLabels = idsAndLabels.filter(
        (idAndLabel) => !isNil(idAndLabel[0])
      );
      const itemIsSelected = (idAndLabel) =>
        selectedIds.includes(idAndLabel[0]);
      if (nonEmptyIdsAndLabels.length > 0) {
        // Check the first item in idsAndLabels; it will settle either someSelected
        // or allSelected
        if (itemIsSelected(nonEmptyIdsAndLabels[0])) {
          const allIsSelected = nonEmptyIdsAndLabels.every(itemIsSelected);
          return {
            checked: allIsSelected,
            indeterminate: !allIsSelected,
          };
        }

        const someIsSelected = nonEmptyIdsAndLabels.some(itemIsSelected);
        return {
          checked: false,
          indeterminate: someIsSelected,
        };
      }

      return {
        checked: false,
        indeterminate: false,
        disabled: true,
      };
    })
);

/**
 * Smart component for showing the drone show configuration view.
 */
const UAVList = connect(
  // mapStateToProps
  (state) => ({
    editingMapping: isMappingEditable(state),
    mappingSlotBeingEdited: getIndexOfMappingSlotBeingEdited(state),
    selectedUAVIds: getSelectedUAVIds(state),
    selectionInfo: getSelectionInfo(state),
    uavIds: getDisplayedIdList(state),
  }),
  // mapDispatchToProps
  {
    onEditMappingSlot: startMappingEditorSessionAtSlot,
    onMappingAdjusted: adjustMissionMapping,
    onSelectionChanged: setSelectedUAVIds,
    onSelectSection: (event) => (dispatch, getState) => {
      const { value } = event.target;
      const displayedIdsAndLabels = getDisplayedIdList(getState())[value];
      const selectedUAVIds = getSelectedUAVIds(getState());
      const selectionInfo = getSelectionInfo(getState())[value];

      if (selectionInfo && displayedIdsAndLabels) {
        const displayedIds = displayedIdsAndLabels.reduce((acc, idAndLabel) => {
          if (!isNil(idAndLabel[0])) {
            acc.push(idAndLabel[0]);
          }

          return acc;
        }, []);
        const newSelection = selectionInfo.checked
          ? difference(selectedUAVIds, displayedIds)
          : union(selectedUAVIds, displayedIds);
        dispatch(setSelectedUAVIds(newSelection));
      }
    },
  }
)(UAVListPresentation);

export default UAVList;
