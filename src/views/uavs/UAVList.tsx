/* eslint-disable @typescript-eslint/ban-types */
/**
 * @file Component that displays the status of the known UAVs in a Skybrush
 * flock.
 */

import Delete from '@mui/icons-material/Delete';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import {
  bindActionCreators,
  type AnyAction,
  type Store,
} from '@reduxjs/toolkit';
import isNil from 'lodash-es/isNil';
import { nanoid } from 'nanoid';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type RefCallback,
} from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { connect, useStore } from 'react-redux';

import { isThemeDark } from '@skybrush/app-theme-mui';

import { createSelectionHandlerThunk } from '~/components/helpers/lists';
import FadeAndSlide from '~/components/transitions/FadeAndSlide';
import DroneAvatar from '~/components/uavs/DroneAvatar';
import DronePlaceholder from '~/components/uavs/DronePlaceholder';
import { useKeyboardNavigation } from '~/features/hotkeys/hooks';
import { setSelection } from '~/features/map/selection';
import {
  getIndexOfMappingSlotBeingEdited,
  isMappingEditable,
} from '~/features/mission/selectors';
import {
  adjustMissionMapping,
  startMappingEditorSessionAtSlot,
} from '~/features/mission/slice';
import {
  getUAVListLayout,
  isShowingMissionIds,
} from '~/features/settings/selectors';
import { UAVListLayout } from '~/features/settings/types';
import { getSelection } from '~/selectors/selection';
import type { AppDispatch, RootState } from '~/store/reducers';
import { formatMissionId } from '~/utils/formatting';
import {
  createScrollerToIndex,
  registerVirtualizedScrollableComponent,
  VirtualizedScrollableComponentId,
  type ScrollerToIndex,
  type VirtualizedScrollableComponentRegistration,
  type VirtualizedScrollFunctions,
} from '~/utils/navigation';
import type { Nullable } from '~/utils/types';

import DroneListItem, { type DroneListItemProps } from './DroneListItem';
import DroneStatusLine from './DroneStatusLine';
import MappingEditorToolbar from './MappingEditorToolbar';
import MappingSlotEditorForGrid from './MappingSlotEditorForGrid';
import MappingSlotEditorForList from './MappingSlotEditorForList';
import MappingSlotEditorToolbar from './MappingSlotEditorToolbar';
import SortAndFilterHeader from './SortAndFilterHeader';
import UAVToolbar from './UAVToolbar';
import VirtualizedUAVListBody from './VirtualizedUAVListBody';
import { HEADER_HEIGHT } from './constants';
import createKeyboardNavigationHandlers, {
  maybeOpenUAVDetailsDialog,
} from './navigation';
import { getDisplayedItems, getGlobalIdsOfDisplayedItems } from './selectors';
import type { Item } from './types';
import { getSelectedUAVIdsAndMissionSlotIds, itemToGlobalId } from './utils';

const useListStyles = makeStyles(
  (theme: Theme) => ({
    appBar: {
      backgroundColor: isThemeDark(theme)
        ? '#424242'
        : theme.palette.background.paper,
      height: 48,
    },

    toolbar: {
      position: 'absolute',
      gap: theme.spacing(0.75),
      left: 0,
      right: 0,
      top: 0,
    },

    gridItem: {
      padding: theme.spacing(1),
      height: '100%',
    },

    listItem: {
      padding: theme.spacing(0.5),
      borderBottom: `1px solid ${theme.palette.divider}`,

      // eslint-disable-next-line @typescript-eslint/naming-convention
      '&:first-child': {
        borderTop: `1px solid ${theme.palette.divider}`,
      },
    },
  }),
  { name: 'UAVList' }
);

type ItemRendererOptions = {
  className?: string;
  draggable: boolean;
  isInEditMode: boolean;
  mappingSlotBeingEdited: number;
  onDropped?: (
    targetIndex: number | undefined
  ) => (droppedUAVId: string) => void;
  onSelectedItem: (item: string) => void;
  onStartEditing: (missionIndex: number) => void;
  selection: string[];
  showMissionIds: boolean;
};

/**
 * Special marker that we can place into the list items returned from
 * getDisplayedItems() to produce a slot where deleted UAVs can be dragged.
 */
const deletionMarker: Item = [undefined, undefined, <Delete key='__delete' />];

/**
 * Helper function to create a single item in the grid view of drone avatars and
 * placeholders.
 */
const createGridItemRenderer =
  ({
    className,
    draggable,
    isInEditMode,
    mappingSlotBeingEdited,
    onDropped,
    onSelectedItem,
    onStartEditing,
    selection,
    showMissionIds,
  }: ItemRendererOptions) =>
  (item: Item): JSX.Element => {
    const [uavId, missionIndex, proposedLabel] = item;
    const itemId = itemToGlobalId(item);
    const editingThisItem =
      mappingSlotBeingEdited !== undefined &&
      missionIndex === mappingSlotBeingEdited;
    const selected = selection.includes(itemId!);
    const listItemProps: Partial<DroneListItemProps> = {
      onClick: isInEditMode
        ? onStartEditing.bind(null, missionIndex!)
        : itemId
          ? onSelectedItem.bind(null, itemId)
          : undefined,
      onDrop: onDropped ? onDropped(missionIndex) : undefined,
      fill: item === deletionMarker,
      selected,
    };

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
        className={className}
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
        className={className}
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

/**
 * Helper function to create a single item in the list view of drone avatars and
 * placeholders.
 */
const createListItemRenderer =
  ({
    className,
    isInEditMode,
    mappingSlotBeingEdited,
    onDropped,
    onSelectedItem,
    onStartEditing,
    selection,
    showMissionIds,
  }: ItemRendererOptions) =>
  (item: Item): JSX.Element | null => {
    if (item === deletionMarker) {
      return null;
    }

    const [uavId, missionIndex, proposedLabel] = item;
    const itemId = itemToGlobalId(item);
    const editingThisItem =
      isInEditMode && missionIndex === mappingSlotBeingEdited;
    const selected = selection.includes(itemId!);
    const listItemProps = {
      className,
      onClick: isInEditMode
        ? onStartEditing.bind(null, missionIndex!)
        : itemId
          ? onSelectedItem.bind(null, itemId)
          : undefined,
      onDrop: onDropped ? onDropped(missionIndex) : undefined,
      selected: isInEditMode ? editingThisItem : selected,
    };

    const isInMission = missionIndex !== undefined;
    const formattedMissionIndex = isInMission
      ? formatMissionId(missionIndex)
      : '';
    const label =
      proposedLabel ?? (showMissionIds ? formattedMissionIndex : uavId);
    const secondaryLabel = editingThisItem
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
  containerDOMNodeId: string;
  dispatch: AppDispatch;
  editingMapping: boolean;
  items: Item[];
  layout: UAVListLayout;
  mappingSlotBeingEdited: number;
  onEditMappingSlot: (missionIndex: number) => void;
  onMappingAdjusted: (args: { uavId: string; to: Nullable<number> }) => void;
  onSelectItem: (id: string) => void;
  selection: string[];
  showMissionIds: boolean;
}>;

/**
 * Presentation component for showing the drone show configuration view.
 */
const UAVListPresentation = ({
  containerDOMNodeId,
  dispatch,
  editingMapping,
  layout,
  mappingSlotBeingEdited,
  onEditMappingSlot,
  onMappingAdjusted,
  onSelectItem,
  selection,
  showMissionIds,
}: UAVListPresentationProps): JSX.Element => {
  // Regular styling stuff
  const classes = useListStyles();

  // Create a callback that can be used to retrun the index of the item showing
  // the given UAV. This is used to focus the list to a specific UAV.
  const store: Store<RootState> = useStore();
  const getIndexOfUavId = useCallback(
    (uavId: string): number => {
      const items = getDisplayedItems(store.getState());
      for (const [i, item] of items.entries()) {
        if (item[0] === uavId) {
          return i;
        }
      }

      return -1;
    },
    [store]
  );

  // Get a ref to the virtualized list or grid and create a scroll-to-index
  // function for it
  const scrollToIndex = useRef<ScrollerToIndex>(() => false);
  const scrollFunctionsRef: RefCallback<VirtualizedScrollFunctions> = (
    value
  ) => {
    scrollToIndex.current = createScrollerToIndex({
      functions: value,
      headerHeight: HEADER_HEIGHT,
    });
  };

  // Register this component as _the_ UAV list component that needs to be
  // focused when the user selects a UAV with the keyboard overlay
  const registration = useMemo(
    (): VirtualizedScrollableComponentRegistration => ({
      id: VirtualizedScrollableComponentId.UAV_LIST,
      getIndexOfItem: getIndexOfUavId,
      scrollToIndex: (index) => scrollToIndex.current(index),
    }),
    [getIndexOfUavId]
  );
  useEffect(
    () => registerVirtualizedScrollableComponent(registration),
    [registration]
  );

  // Create the keyboard navigation handler functions
  const keyboardNav = useMemo(
    () =>
      createKeyboardNavigationHandlers(
        dispatch,
        containerDOMNodeId,
        (index) => {
          scrollToIndex.current(index);
        }
      ),
    [dispatch, containerDOMNodeId]
  );
  useKeyboardNavigation(keyboardNav);

  // Create a callback for dropping a UAV on another item in the list when
  // rearranging the mapping using drag-and-drop
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

  // Create the item renderer
  const itemRendererOptions: ItemRendererOptions = {
    className:
      layout === UAVListLayout.GRID ? classes.gridItem : classes.listItem,
    draggable: editingMapping,
    isInEditMode: editingMapping,
    mappingSlotBeingEdited,
    onDropped: editingMapping ? onDropped : undefined,
    onSelectedItem: onSelectItem,
    onStartEditing: onEditMappingSlot,
    selection,
    showMissionIds,
  };
  const itemRenderer =
    layout === UAVListLayout.GRID
      ? createGridItemRenderer(itemRendererOptions)
      : createListItemRenderer(itemRendererOptions);

  // Finally, render time!
  return (
    <DndProvider backend={HTML5Backend}>
      <Box display='flex' flexDirection='column' height='100%'>
        <AppBar color='default' position='static' className={classes.appBar}>
          <FadeAndSlide mountOnEnter unmountOnExit in={!editingMapping}>
            <UAVToolbar className={classes.toolbar} />
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
        <Box flex={1} position='relative'>
          <SortAndFilterHeader floating />
          {/* We assume that each grid item is a <div> in the <Box> when we
           * calculate how many columns there are in the grid. Revise the
           * layout functions in connect() if this is not the case any more */}
          <VirtualizedUAVListBody
            ref={scrollFunctionsRef}
            id={containerDOMNodeId}
            itemRenderer={itemRenderer}
            layout={layout}
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
    </DndProvider>
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
    selection: getSelection(state),
    showMissionIds: isShowingMissionIds(state),
  }),
  // mapDispatchToProps
  () => {
    const containerDOMNodeId = `__keyboardNav-${nanoid()}`;

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    return (dispatch) => ({
      containerDOMNodeId,
      dispatch,
      ...bindActionCreators(
        {
          onEditMappingSlot: startMappingEditorSessionAtSlot,
          onMappingAdjusted: adjustMissionMapping,
          onSelectItem: createSelectionHandlerThunk({
            activateItem: maybeOpenUAVDetailsDialog,
            getSelection: getSelectedUAVIdsAndMissionSlotIds,
            setSelection,
            getListItems: getGlobalIdsOfDisplayedItems,
          }) as any as (id: string) => AnyAction,
        },
        dispatch
      ),
    });
  }
)(UAVListPresentation);

export default UAVList;
