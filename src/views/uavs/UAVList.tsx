/**
 * @file Component that displays the status of the known UAVs in a Skybrush
 * flock.
 */

import Delete from '@mui/icons-material/Delete';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';
import { bindActionCreators, type AnyAction } from '@reduxjs/toolkit';
import clsx from 'clsx';
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

import { isThemeDark, makeStyles } from '@skybrush/app-theme-mui';

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

import DroneGridCard from './DroneGridCard';
import DroneListItem, { type DroneListItemProps } from './DroneListItem';
import DroneStatusLine from './DroneStatusLine';
import MappingEditorToolbar from './MappingEditorToolbar';
import MappingSlotEditorForGrid from './MappingSlotEditorForGrid';
import MappingSlotEditorForList from './MappingSlotEditorForList';
import MappingSlotEditorToolbar from './MappingSlotEditorToolbar';
import SortAndFilterHeader from './SortAndFilterHeader';
import UAVToolbar from './UAVToolbar';
import VirtualizedUAVListBody from './VirtualizedUAVListBody';
import { HEADER_HEIGHT, LIST_ROW_HEIGHT } from './constants';
import createKeyboardNavigationHandlers, {
  maybeOpenUAVDetailsDialog,
} from './navigation';
import { getDisplayedItems, getGlobalIdsOfDisplayedItems } from './selectors';
import type { Item } from './types';
import { getSelectedUAVIdsAndMissionSlotIds, itemToGlobalId } from './utils';

const useListStyles = makeStyles((theme: Theme) => ({
  appBar: {
    background: isThemeDark(theme)
      ? 'linear-gradient(180deg, #1c2230 0%, #141820 100%)'
      : theme.palette.background.paper,
    borderBottom: `1px solid ${
      isThemeDark(theme) ? 'rgba(110, 182, 255, 0.12)' : theme.palette.divider
    }`,
    boxShadow: isThemeDark(theme)
      ? '0 2px 14px rgba(0, 0, 0, 0.35)'
      : '0 1px 6px rgba(15, 23, 42, 0.08)',
    height: 48,
  },

  toolbar: {
    gap: theme.spacing(0.5),
    left: 0,
    minHeight: 48,
    position: 'absolute',
    right: 0,
    top: 0,
  },

  gridItem: {
    padding: theme.spacing(1),
    height: '100%',
  },

  listItem: {
    borderBottom: `1px solid ${
      isThemeDark(theme) ? 'rgba(255, 255, 255, 0.06)' : theme.palette.divider
    }`,
    boxSizing: 'border-box',
    height: LIST_ROW_HEIGHT,
    maxHeight: LIST_ROW_HEIGHT,
    minHeight: LIST_ROW_HEIGHT,
  },

  listItemAlt: {
    backgroundColor: isThemeDark(theme)
      ? 'rgba(255, 255, 255, 0.025)'
      : 'rgba(0, 0, 0, 0.025)',
  },
}));

type ItemRendererOptions = {
  className?: string;
  altClassName?: string;
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
  (item: Item): React.JSX.Element => {
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

    const card = (
      <DroneGridCard selected={selected}>
        {uavId === undefined ? (
          <DronePlaceholder
            editing={editingThisItem}
            label={editingThisItem ? '' : label}
            status={missionIndex === undefined ? 'error' : 'off'}
          />
        ) : (
          <DroneAvatar
            id={uavId}
            editing={editingThisItem}
            label={editingThisItem ? '' : label}
            selected={selected}
          />
        )}
      </DroneGridCard>
    );

    return uavId === undefined ? (
      <DroneListItem
        key={key}
        className={className}
        onDrop={onDropped ? onDropped(missionIndex) : undefined}
        variant='grid'
        {...listItemProps}
      >
        {editingThisItem && <MappingSlotEditorForGrid />}
        {card}
      </DroneListItem>
    ) : (
      <DroneListItem
        key={key}
        className={className}
        draggable={draggable}
        uavId={uavId}
        variant='grid'
        {...listItemProps}
      >
        {editingThisItem && <MappingSlotEditorForGrid />}
        {card}
      </DroneListItem>
    );
  };

/**
 * Helper function to create a single item in the list view of drone avatars and
 * placeholders.
 */
const createListItemRenderer =
  ({
    altClassName,
    className,
    isInEditMode,
    mappingSlotBeingEdited,
    onDropped,
    onSelectedItem,
    onStartEditing,
    selection,
    showMissionIds,
  }: ItemRendererOptions) =>
  (item: Item, index = 0): React.JSX.Element | null => {
    if (item === deletionMarker) {
      return null;
    }

    const [uavId, missionIndex, proposedLabel] = item;
    const itemId = itemToGlobalId(item);
    const editingThisItem =
      isInEditMode && missionIndex === mappingSlotBeingEdited;
    const selected = selection.includes(itemId!);
    const listItemProps = {
      className: clsx(className, index % 2 === 1 && altClassName),
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
}: UAVListPresentationProps): React.JSX.Element => {
  // Regular styling stuff
  const classes = useListStyles();

  // Create a callback that can be used to retrun the index of the item showing
  // the given UAV. This is used to focus the list to a specific UAV.
  const store = useStore<RootState>();
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
      headerHeight: 0,
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
    altClassName: classes.listItemAlt,
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
      <Box
        data-uav-list-root
        sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
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
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            minHeight: 0,
            position: 'relative',
          }}
        >
          <SortAndFilterHeader />
          {/* We assume that each grid item is a <div> in the <Box> when we
           * calculate how many columns there are in the grid. Revise the
           * layout functions in connect() if this is not the case any more */}
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <VirtualizedUAVListBody
              ref={scrollFunctionsRef}
              id={containerDOMNodeId}
              itemRenderer={itemRenderer}
              layout={layout}
            />
          </Box>
        </Box>
        {editingMapping && layout === UAVListLayout.GRID ? (
          <Box className='bottom-bar'>
            <Box
              sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}
            >
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
