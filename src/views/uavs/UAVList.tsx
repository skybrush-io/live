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
import { bindActionCreators, type AnyAction } from '@reduxjs/toolkit';

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
import UAVListBody from './UAVListBody';
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
import { setSelectedMissionSlotIds } from '~/features/mission/actions';
import {
  adjustMissionMapping,
  startMappingEditorSessionAtSlot,
} from '~/features/mission/slice';
import {
  getIndexOfMappingSlotBeingEdited,
  getSelectedMissionSlotIds,
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
import { usePersistentScrollPosition } from '~/hooks';
import { formatMissionId } from '~/utils/formatting';

import {
  deletionMarker,
  getDisplayedIdList,
  getDisplayedIdListBySections,
  getSelectionInfo,
} from './selectors';
import { uavIdToDOMNodeId } from './utils';
import type { GroupedUAVIds, GroupSelectionInfo, Item } from './types';
import { UAVListLayout, UAVListOrientation } from '~/features/settings/types';
import type { AppThunk, RootState } from '~/store/reducers';
import type { Nullable } from '~/utils/types';

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

type ItemFactoryOptions = {
  draggable: boolean;
  isInEditMode: boolean;
  mappingSlotBeingEdited: number;
  onDropped?: (
    targetIndex: number | undefined
  ) => (droppedUAVId: string) => void;
  onSelectedMissionSlot: (missionSlotId: string) => void;
  onSelectedUAV: (uavId: string) => void;
  onStartEditing: (missionIndex: number) => void;
  selectedMissionSlotIds: string[];
  selectedUAVIds: string[];
  showMissionIds: boolean;
};

/**
 * Helper function to create a single item in the grid view of drone avatars and
 * placeholders.
 */
/* eslint-disable complexity */
const createGridItemRenderer =
  ({
    draggable,
    isInEditMode,
    mappingSlotBeingEdited,
    onDropped,
    onSelectedMissionSlot,
    onSelectedUAV,
    onStartEditing,
    selectedMissionSlotIds,
    selectedUAVIds,
    showMissionIds,
  }: ItemFactoryOptions) =>
  (item: Item): JSX.Element => {
    const [uavId, missionIndex, proposedLabel] = item;
    const missionSlotId = String(missionIndex);
    const editingThisItem =
      mappingSlotBeingEdited !== undefined &&
      missionIndex === mappingSlotBeingEdited;
    const selected =
      selectedUAVIds.includes(uavId!) ||
      selectedMissionSlotIds.includes(missionSlotId);
    const listItemProps: Record<string, any> = {
      /* prettier-ignore */
      onClick:
        isInEditMode  ? onStartEditing.bind(null, missionIndex!) :
        uavId         ? onSelectedUAV.bind(null, uavId) :
        missionSlotId ? onSelectedMissionSlot.bind(null, missionSlotId) :
        undefined,
      onDrop: onDropped ? onDropped(missionIndex) : undefined,
      editing: editingThisItem,
      selected,
    };

    if (item === deletionMarker) {
      listItemProps['fill'] = true;
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
      proposedLabel ??
      (showMissionIds
        ? missionIndex !== undefined && (!isInEditMode || uavId === undefined)
          ? formatMissionId(missionIndex)
          : uavId
        : uavId);

    const key = uavId ?? `placeholder-${String(label) || 'null'}`;

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
  };
/* eslint-enable complexity */

/**
 * Helper function to create a single item in the list view of drone avatars and
 * placeholders.
 */
const createListItemRenderer =
  ({
    isInEditMode,
    mappingSlotBeingEdited,
    onDropped,
    onSelectedUAV,
    onSelectedMissionSlot,
    onStartEditing,
    selectedUAVIds,
    selectedMissionSlotIds,
    showMissionIds,
  }: ItemFactoryOptions) =>
  // eslint-disable-next-line @typescript-eslint/ban-types
  (item: Item): JSX.Element | null => {
    if (item === deletionMarker) {
      return null;
    }

    const [uavId, missionIndex, proposedLabel] = item;
    const missionSlotId = String(missionIndex);
    const editingThisItem =
      isInEditMode && missionIndex === mappingSlotBeingEdited;
    const selected =
      selectedUAVIds.includes(uavId!) ||
      selectedMissionSlotIds.includes(missionSlotId);
    const listItemProps = {
      /* prettier-ignore */
      onClick:
        isInEditMode  ? onStartEditing.bind(null, missionIndex!) :
        uavId         ? onSelectedUAV.bind(null, uavId) :
        missionSlotId ? onSelectedMissionSlot.bind(null, missionSlotId) :
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
      proposedLabel ??
      (showMissionIds && isInMission ? formattedMissionIndex : uavId);
    const secondaryLabel =
      editingThisItem || (showMissionIds && !isInMission)
        ? ''
        : showMissionIds
          ? uavId
          : formattedMissionIndex;
    const key = uavId ?? `placeholder-${String(label) || 'null'}`;

    return (
      <DroneListItem key={key} stretch uavId={uavId} {...listItemProps}>
        {editingThisItem && <MappingSlotEditorForList />}
        <DroneStatusLine
          id={uavId}
          label={String(label)}
          secondaryLabel={secondaryLabel}
        />
      </DroneListItem>
    );
  };

type UAVListPresentationProps = Readonly<{
  containerDOMNodeId?: string;
  editingMapping: boolean;
  keyboardNav: Record<string, any>; // TODO: Define type
  layout: UAVListLayout;
  mappingSlotBeingEdited: number;
  onEditMappingSlot: (missionIndex: number) => void;
  onMappingAdjusted: (args: { uavId: string; to: Nullable<number> }) => void;
  onSelectMissionSlot: (missionSlotId: string) => void;
  onSelectSection: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectUAV: (uavId: string) => void;
  selectedMissionSlotIds: string[];
  selectionInfo: GroupSelectionInfo;
  selectedUAVIds: string[];
  showMissionIds: boolean;
  uavIds: GroupedUAVIds;
}>;

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
  selectedMissionSlotIds,
  selectionInfo,
  showMissionIds,
  uavIds,
}: UAVListPresentationProps): JSX.Element => {
  const classes = useListStyles();

  useKeyboardNavigation(keyboardNav);

  const onDropped = useCallback(
    (targetIndex: number | undefined) =>
      (droppedUAVId: string): void => {
        onMappingAdjusted({
          uavId: droppedUAVId,
          to: isNil(targetIndex) ? null : targetIndex,
        });
      },
    [onMappingAdjusted]
  );

  const [uavListRef, uavListOnScroll] = usePersistentScrollPosition();

  const itemRendererOptions = {
    draggable: editingMapping,
    isInEditMode: editingMapping,
    mappingSlotBeingEdited,
    onDropped: editingMapping ? onDropped : undefined,
    onSelectedUAV: onSelectUAV,
    onSelectedMissionSlot: onSelectMissionSlot,
    onStartEditing: onEditMappingSlot,
    selectedUAVIds,
    selectedMissionSlotIds,
    showMissionIds,
  };
  const itemRenderer =
    layout === UAVListLayout.GRID
      ? createGridItemRenderer(itemRendererOptions)
      : createListItemRenderer(itemRendererOptions);

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
        {...{ ref: uavListRef }} // fugly but works -- Box does not have ref in its typing
        flex={1}
        overflow='auto'
        id={containerDOMNodeId}
        onScroll={uavListOnScroll}
      >
        {/* We assume that each grid item is a <div> in the <Box> when we
         * calculate how many columns there are in the grid. Revise the
         * layout functions in connect() if this is not the case any more */}
        <SortAndFilterHeader />
        <UAVListBody
          editingMapping={editingMapping}
          itemRenderer={itemRenderer}
          layout={layout}
          selectionInfo={selectionInfo}
          showMissionIds={showMissionIds}
          uavIds={uavIds}
          onSelectSection={onSelectSection}
        />
      </Box>
      {editingMapping && layout === UAVListLayout.GRID ? (
        <Box className='bottom-bar'>
          <Box display='flex' flexDirection='row' flexWrap='wrap'>
            {itemRenderer(deletionMarker)}
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

/**
 * Smart component for showing the drone show configuration view.
 */
const UAVList = connect(
  // mapStateToProps
  (state: RootState) => ({
    editingMapping: isMappingEditable(state),
    mappingSlotBeingEdited: getIndexOfMappingSlotBeingEdited(state),
    layout: getUAVListLayout(state),
    selectedUAVIds: getSelectedUAVIds(state),
    selectedMissionSlotIds: getSelectedMissionSlotIds(state),
    selectionInfo: getSelectionInfo(state),
    showMissionIds: isShowingMissionIds(state),
    uavIds: getDisplayedIdListBySections(state),
  }),
  // mapDispatchToProps
  () => {
    const containerDOMNodeId = `__keyboardNav-${nanoid()}`;

    const getColumnCount = (): number => {
      const containerDOMNode = document.querySelector(`#${containerDOMNodeId}`);

      // Assumption: the width of the container divided by 80 is an estimate of
      // how many columns there are in the grid.
      const { width: containerWidth } =
        containerDOMNode?.getBoundingClientRect() ?? {};
      if (typeof containerWidth === 'number' && containerWidth > 0) {
        return Math.max(1, Math.floor(containerWidth / 80));
      } else {
        return 1;
      }
    };

    const getNavigationDeltaInDirection = (
      state: RootState,
      direction: string
    ): number => {
      const orientation = getUAVListOrientation(state);

      if (orientation === UAVListOrientation.VERTICAL) {
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

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
        setFocusToId: (id: string) => `#${uavIdToDOMNodeId(id)}`,
      }),

      ...bindActionCreators(
        {
          onEditMappingSlot: startMappingEditorSessionAtSlot,
          onMappingAdjusted: adjustMissionMapping,
          onSelectUAV: createSelectionHandlerThunk({
            activateItem: openUAVDetailsDialog,
            getSelection: getSelectedUAVIds,
            setSelection: setSelectedUAVIds,
            getListItems(state: RootState) {
              const displayedIds = getDisplayedIdListBySections(state);
              const allIds = displayedIds.mainUAVIds
                .concat(displayedIds.spareUAVIds)
                .map(([u, _m]) => u)
                .filter((u) => !isNil(u));
              return allIds;
            },
          }) as any as (uavId: string) => AnyAction,
          // FIXME: Currently selecting a range between an empty and an assigned
          //        mission slot doesn't work, as assigned slots actually select
          //        the UAV id instead of the mission slot ID.
          onSelectMissionSlot: createSelectionHandlerThunk({
            getSelection: getSelectedMissionSlotIds,
            setSelection: setSelectedMissionSlotIds as any as (
              ids: string[]
            ) => AnyAction, // TODO: remove the cast when setSelectedMissionSlotIds is migrated to TypeScript
            getListItems: (state: RootState) =>
              getDisplayedIdListBySections(state).mainUAVIds.map(([_u, m]) =>
                String(m)
              ),
          }) as any as (missionSlotId: string) => AnyAction,
          onSelectSection:
            (event: React.ChangeEvent<HTMLInputElement>): AppThunk =>
            (dispatch, getState) => {
              const { value } = event.target;
              const state = getState();
              if (value !== 'mainUAVIds' && value !== 'spareUAVIds') {
                // This is to make TypeScript happy
                return;
              }

              const displayedIdsAndLabels =
                getDisplayedIdListBySections(state)[value];
              const selectedUAVIds = getSelectedUAVIds(state);
              const selectionInfo = getSelectionInfo(state)[value];

              if (selectionInfo && displayedIdsAndLabels) {
                const displayedIds: string[] = [];
                for (const idAndLabel of displayedIdsAndLabels) {
                  const head = idAndLabel[0];
                  if (!isNil(head)) {
                    displayedIds.push(head);
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
