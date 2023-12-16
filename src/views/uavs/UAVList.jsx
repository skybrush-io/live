/**
 * @file Component that displays the status of the known UAVs in a Skybrush
 * flock.
 */

import difference from 'lodash-es/difference';
import isNil from 'lodash-es/isNil';
import union from 'lodash-es/union';
import { nanoid } from 'nanoid';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { connect } from 'react-redux';
import { bindActionCreators } from '@reduxjs/toolkit';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import makeStyles from '@material-ui/core/styles/makeStyles';

import { isThemeDark } from '@skybrush/app-theme-material-ui';

import DroneListItem from './DroneListItem';
import DroneStatusLine from './DroneStatusLine';
import MappingEditorToolbar from './MappingEditorToolbar';
import MappingSlotEditorForGrid from './MappingSlotEditorForGrid';
import MappingSlotEditorForList from './MappingSlotEditorForList';
import MappingSlotEditorToolbar from './MappingSlotEditorToolbar';
import SortAndFilterHeader from './SortAndFilterHeader';
import UAVListSubheader from './UAVListSubheader';
import UAVToolbar from './UAVToolbar';

import { createSelectionHandlerThunk } from '~/components/helpers/lists';
import FadeAndSlide from '~/components/transitions/FadeAndSlide';
import DroneAvatar from '~/components/uavs/DroneAvatar';
import DronePlaceholder from '~/components/uavs/DronePlaceholder';
import { useKeyboardNavigation } from '~/features/hotkeys/hooks';
import {
  createKeyboardNavigationHandlers,
  Direction,
} from '~/features/hotkeys/navigation';
import { setSelectedMissionSlots } from '~/features/mission/actions';
import {
  adjustMissionMapping,
  startMappingEditorSessionAtSlot,
} from '~/features/mission/slice';
import {
  getIndexOfMappingSlotBeingEdited,
  getSelectedMissionIndices,
  isMappingEditable,
} from '~/features/mission/selectors';
import {
  getUAVListLayout,
  getUAVListOrientation,
  isShowingMissionIds,
} from '~/features/settings/selectors';
import { setSelectedUAVIds } from '~/features/uavs/actions';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { getSelectedUAVIds } from '~/features/uavs/selectors';
import { formatMissionId } from '~/utils/formatting';

import {
  deletionMarker,
  getDisplayedIdList,
  getDisplayedIdListBySections,
  getSelectionInfo,
} from './selectors';
import { uavIdToDOMNodeId } from './utils';
import { usePersistentScrollPosition } from '~/hooks';

const useListStyles = makeStyles(
  (theme) => ({
    appBar: {
      backgroundColor: isThemeDark(theme)
        ? '#424242'
        : theme.palette.background.paper,
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

const useListSectionStyles = makeStyles(
  (theme) => ({
    grid: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',

      '&>div': {
        padding: theme.spacing(1),
      },
    },

    list: {
      display: 'flex',
      alignItems: 'stretch',
      flexDirection: 'column',
      fontSize: '12px',

      '&>div': {
        padding: theme.spacing(0.5),
        borderBottom: `1px solid ${theme.palette.divider}`,
      },

      '&>div:first-child': {
        borderTop: `1px solid ${theme.palette.divider}`,
      },
    },
  }),
  { name: 'UAVListSection' }
);

/**
 * Helper function to create the items in the grid view of drone avatars and
 * placeholders.
 */
/* eslint-disable complexity */
const createGridItems = (
  items,
  {
    draggable,
    isInEditMode,
    mappingSlotBeingEdited,
    onDropped,
    onSelectedMissionSlot,
    onSelectedUAV,
    onStartEditing,
    selectedMissionIndices,
    selectedUAVIds,
    showMissionIds,
  }
) =>
  items.map((item) => {
    const [uavId, missionIndex, proposedLabel] = item;
    const editingThisItem =
      mappingSlotBeingEdited !== undefined &&
      missionIndex === mappingSlotBeingEdited;
    const selected =
      selectedUAVIds.includes(uavId) ||
      selectedMissionIndices.includes(`${missionIndex}`);
    const listItemProps = {
      /* prettier-ignore */
      onClick:
        isInEditMode ? (_event) => onStartEditing(missionIndex) :
        uavId        ? (event) => onSelectedUAV(event, uavId) :
        missionIndex ? (event) => onSelectedMissionSlot(event, missionIndex) :
        undefined,
      onDrop: onDropped ? onDropped(missionIndex) : undefined,
      editing: editingThisItem,
      selected,
    };

    if (item === deletionMarker) {
      listItemProps.fill = true;
    }

    // Derive the main (large) label of the grid item. The rules are:
    //
    // - if we have a proposed label, use that
    // - if we are not showing mission IDs, use the UAV ID
    // - if we are showing mission IDs and we are not edit mode, format the
    //   mission ID nicely and show that -- unless we don't have a mission ID
    //   (we are in a spare slot), in which case use the UAV ID
    // - if we are editing the mission mapping, show the UAV ID because that's
    //   what we are going to allow the user to modify

    const label =
      proposedLabel ||
      (showMissionIds
        ? missionIndex !== undefined && (!isInEditMode || uavId === undefined)
          ? formatMissionId(missionIndex)
          : uavId
        : uavId);

    const key = uavId === undefined ? `placeholder-${label || 'null'}` : uavId;

    return uavId === undefined ? (
      <DroneListItem
        key={key}
        onDrop={onDropped ? onDropped(missionIndex) : undefined}
        {...listItemProps}
      >
        {editingThisItem && <MappingSlotEditorForGrid />}
        <DronePlaceholder
          editing={editingThisItem}
          label={editingThisItem ? '' : label}
          status={missionIndex === undefined ? 'error' : 'off'}
        />
      </DroneListItem>
    ) : (
      <DroneListItem
        key={key}
        draggable={draggable}
        uavId={uavId}
        {...listItemProps}
      >
        {editingThisItem && <MappingSlotEditorForGrid />}
        <DroneAvatar
          id={uavId}
          editing={editingThisItem}
          label={editingThisItem ? '' : label}
          selected={selected}
        />
      </DroneListItem>
    );
  });
/* eslint-enable complexity */

/**
 * Helper function to create the items in the list view of drone avatars and
 * placeholders.
 */
const createListItems = (
  items,
  {
    isInEditMode,
    mappingSlotBeingEdited,
    onDropped,
    onSelectedUAV,
    onSelectedMissionSlot,
    onStartEditing,
    selectedUAVIds,
    selectedMissionIndices,
    showMissionIds,
  }
) =>
  items.map((item) => {
    if (item === deletionMarker) {
      return null;
    }

    const [uavId, missionIndex, proposedLabel] = item;
    const editingThisItem =
      isInEditMode && missionIndex === mappingSlotBeingEdited;
    const selected =
      selectedUAVIds.includes(uavId) ||
      selectedMissionIndices.includes(`${missionIndex}`);
    const listItemProps = {
      /* prettier-ignore */
      onClick:
        isInEditMode ? (_event) => onStartEditing(missionIndex) :
        uavId        ? (event) => onSelectedUAV(event, uavId) :
        missionIndex ? (event) => onSelectedMissionSlot(event, missionIndex) :
        undefined,
      onDrop: onDropped ? onDropped(missionIndex) : undefined,
      editing: editingThisItem,
      selected: isInEditMode ? editingThisItem : selected,
    };

    const isInMission = missionIndex !== undefined;
    const formattedMissionIndex = isInMission
      ? formatMissionId(missionIndex)
      : '';
    const label =
      proposedLabel ||
      (showMissionIds && isInMission ? formattedMissionIndex : uavId);
    const secondaryLabel =
      editingThisItem || (showMissionIds && !isInMission)
        ? ''
        : showMissionIds
          ? uavId
          : formattedMissionIndex;
    const key = uavId === undefined ? `placeholder-${label || 'null'}` : uavId;

    return (
      <DroneListItem key={key} stretch uavId={uavId} {...listItemProps}>
        {editingThisItem && <MappingSlotEditorForList />}
        <DroneStatusLine
          id={uavId}
          label={label}
          secondaryLabel={secondaryLabel}
        />
      </DroneListItem>
    );
  });

const UAVListSection = ({
  forceVisible,
  ids,
  itemFactory,
  itemFactoryOptions,
  layout,
  ...rest
}) => {
  const classes = useListSectionStyles();

  if (ids.length <= 0 && !forceVisible) {
    return null;
  }

  return (
    <>
      <UAVListSubheader {...rest} />
      <Box className={layout === 'grid' ? classes.grid : classes.list}>
        {itemFactory(ids, itemFactoryOptions)}
      </Box>
    </>
  );
};

UAVListSection.propTypes = {
  forceVisible: PropTypes.bool,
  ids: PropTypes.array,
  itemFactory: PropTypes.func,
  itemFactoryOptions: PropTypes.object,
  layout: PropTypes.oneOf(['grid', 'list']),
};

/**
 * Presentation component for showing the drone show configuration view.
 */
const UAVListPresentation = ({
  containerDOMNodeId,
  editingMapping,
  keyboardNav,
  layout,
  mappingSlotBeingEdited,
  onEditMappingSlot,
  onMappingAdjusted,
  onSelectUAV,
  onSelectMissionSlot,
  onSelectSection,
  selectedUAVIds,
  selectedMissionIndices,
  selectionInfo,
  showMissionIds,
  uavIds,
}) => {
  const classes = useListStyles();

  useKeyboardNavigation(keyboardNav);

  const onDropped = useCallback(
    (targetIndex) => (droppedUAVId) =>
      onMappingAdjusted({
        uavId: droppedUAVId,
        to: targetIndex,
      }),
    [onMappingAdjusted]
  );

  const [uavListRef, uavListOnScroll] = usePersistentScrollPosition();

  const { mainUAVIds, spareUAVIds, extraSlots } = uavIds;

  const itemFactory = layout === 'grid' ? createGridItems : createListItems;

  const itemFactoryOptions = {
    draggable: editingMapping,
    isInEditMode: editingMapping,
    mappingSlotBeingEdited,
    onDropped: editingMapping && onDropped,
    onSelectedUAV: onSelectUAV,
    onSelectedMissionSlot: onSelectMissionSlot,
    onStartEditing: onEditMappingSlot,
    selectedUAVIds,
    selectedMissionIndices,
    showMissionIds,
  };

  const mainBox = (
    <Box display='flex' flexDirection='column' height='100%'>
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
      <Box
        ref={uavListRef}
        flex={1}
        overflow='auto'
        id={containerDOMNodeId}
        onScroll={uavListOnScroll}
      >
        {/* We assume that each grid item is a <div> in the <Box> when we
         * calculate how many columns there are in the grid. Revise the
         * layout functions in connect() if this is not the case any more */}
        <SortAndFilterHeader layout={layout} />
        <UAVListSection
          ids={mainUAVIds}
          itemFactory={itemFactory}
          itemFactoryOptions={itemFactoryOptions}
          label={showMissionIds ? 'Assigned UAVs' : 'All UAVs'}
          layout={layout}
          value='mainUAVIds'
          onSelect={onSelectSection}
          {...selectionInfo.mainUAVIds}
        />
        <UAVListSection
          ids={spareUAVIds}
          itemFactory={itemFactory}
          itemFactoryOptions={itemFactoryOptions}
          label='Spare UAVs'
          layout={layout}
          value='spareUAVIds'
          forceVisible={editingMapping}
          onSelect={onSelectSection}
          {...selectionInfo.spareUAVIds}
        />
      </Box>
      {extraSlots.length > 0 && layout === 'grid' ? (
        <Box className='bottom-bar'>
          <Box display='flex' flexDirection='row' flexWrap='wrap'>
            {createGridItems(extraSlots, itemFactoryOptions)}
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
  containerDOMNodeId: PropTypes.string,
  editingMapping: PropTypes.bool,
  keyboardNav: PropTypes.object,
  mappingSlotBeingEdited: PropTypes.number,
  layout: PropTypes.oneOf(['list', 'grid']),
  onEditMappingSlot: PropTypes.func,
  onMappingAdjusted: PropTypes.func,
  onSelectUAV: PropTypes.func,
  onSelectMissionSlot: PropTypes.func,
  onSelectSection: PropTypes.func,
  selectedUAVIds: PropTypes.array,
  selectedMissionIndices: PropTypes.array,
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
      indeterminate: PropTypes.bool,
    }),
  }),
  showMissionIds: PropTypes.bool,
  uavIds: PropTypes.exact({
    mainUAVIds: PropTypes.arrayOf(PropTypes.array).isRequired,
    spareUAVIds: PropTypes.arrayOf(PropTypes.array).isRequired,
    extraSlots: PropTypes.arrayOf(PropTypes.array).isRequired,
  }).isRequired,
};

/**
 * Smart component for showing the drone show configuration view.
 */
const UAVList = connect(
  // mapStateToProps
  (state) => ({
    editingMapping: isMappingEditable(state),
    mappingSlotBeingEdited: getIndexOfMappingSlotBeingEdited(state),
    layout: getUAVListLayout(state),
    selectedUAVIds: getSelectedUAVIds(state),
    selectedMissionIndices: getSelectedMissionIndices(state),
    selectionInfo: getSelectionInfo(state),
    showMissionIds: isShowingMissionIds(state),
    uavIds: getDisplayedIdListBySections(state),
  }),
  // mapDispatchToProps
  () => {
    const containerDOMNodeId = `__keyboardNav-${nanoid()}`;

    const getColumnCount = () => {
      const containerDOMNode = document.querySelector(`#${containerDOMNodeId}`);

      // Assumption: the width of the container divided by 80 is an estimate of
      // how many columns there are in the grid.
      const { width: containerWidth } =
        containerDOMNode?.getBoundingClientRect() || {};
      if (typeof containerWidth === 'number' && containerWidth > 0) {
        return Math.max(1, Math.floor(containerWidth / 80));
      } else {
        return 1;
      }
    };

    const getNavigationDeltaInDirection = (state, direction) => {
      const orientation = getUAVListOrientation(state);

      if (orientation === 'vertical') {
        // Vertical layout. Horizontal navigation is disallowed and we always
        // step by 1 vertically.
        switch (direction) {
          case Direction.DOWN:
            return 1;
          case Direction.UP:
            return -1;
          case Direction.NEXT_PAGE:
            return 10;
          case Direction.PREVIOUS_PAGE:
            return -10;
          default:
            return 0;
        }
      } else {
        // Horizontal layout. We always step by 1 horizontally. In vertical
        // direction we need to figure out how many columns there are.
        switch (direction) {
          case Direction.LEFT:
            return -1;
          case Direction.RIGHT:
            return 1;
          case Direction.UP:
          case Direction.PREVIOUS_PAGE:
            return -getColumnCount();
          case Direction.DOWN:
          case Direction.NEXT_PAGE:
            return getColumnCount();

          default:
            return 0;
        }
      }
    };

    return (dispatch) => ({
      containerDOMNodeId,

      keyboardNav: createKeyboardNavigationHandlers({
        dispatch,
        activateId: openUAVDetailsDialog,
        getNavigationDeltaInDirection,
        getVisibleIds: getDisplayedIdList,
        getSelectedIds: getSelectedUAVIds,
        getLayout: getUAVListOrientation,
        setSelectedIds: setSelectedUAVIds,
        setFocusToId: (id) => `#${uavIdToDOMNodeId(id)}`,
      }),

      ...bindActionCreators(
        {
          onEditMappingSlot: startMappingEditorSessionAtSlot,
          onMappingAdjusted: adjustMissionMapping,
          onSelectUAV: createSelectionHandlerThunk({
            activateItem: openUAVDetailsDialog,
            getSelection: getSelectedUAVIds,
            setSelection: setSelectedUAVIds,
          }),
          onSelectMissionSlot: createSelectionHandlerThunk({
            getSelection: getSelectedMissionIndices,
            setSelection: setSelectedMissionSlots,
          }),
          onSelectSection: (event) => (dispatch, getState) => {
            const { value } = event.target;
            const state = getState();
            const displayedIdsAndLabels =
              getDisplayedIdListBySections(state)[value];
            const selectedUAVIds = getSelectedUAVIds(state);
            const selectionInfo = getSelectionInfo(state)[value];

            if (selectionInfo && displayedIdsAndLabels) {
              const displayedIds = [];
              for (const idAndLabel of displayedIdsAndLabels) {
                if (!isNil(idAndLabel[0])) {
                  displayedIds.push(idAndLabel[0]);
                }
              }

              const newSelection = selectionInfo.checked
                ? difference(selectedUAVIds, displayedIds)
                : union(selectedUAVIds, displayedIds);
              dispatch(setSelectedUAVIds(newSelection));
            }
          },
        },
        dispatch
      ),
    });
  }
)(UAVListPresentation);

export default UAVList;
