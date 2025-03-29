/**
 * @file Component that displays the status of the known UAVs in a Skybrush
 * flock.
 */

import difference from 'lodash-es/difference';
import isNil from 'lodash-es/isNil';
import union from 'lodash-es/union';
import { nanoid } from 'nanoid';
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
  type KeyboardNavigationHandlers,
} from '~/features/hotkeys/navigation';
import {
  adjustMissionMapping,
  startMappingEditorSessionAtSlot,
} from '~/features/mission/slice';
import {
  getIndexOfMappingSlotBeingEdited,
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
  getDisplayedGroups,
  getSelectionInfo,
  getUAVIdsInDisplayedGroups,
  getAllGlobalIdsInDisplayedGroups,
} from './selectors';
import {
  getSelectedUAVIdsAndMissionSlotIds,
  globalIdToDOMNodeId,
  itemToGlobalId,
} from './utils';
import type { GroupSelectionInfo, Item, UAVGroup } from './types';
import { UAVListLayout, UAVListOrientation } from '~/features/settings/types';
import type { AppThunk, RootState } from '~/store/reducers';
import type { Nullable } from '~/utils/types';
import { globalIdToUavId } from '~/model/identifiers';
import { getSelection } from '~/selectors/selection';
import { setSelection } from '~/features/map/selection';
import VirtualizedUAVListBody from './VirtualizedUAVListBody';
import usePersistentVirtualizedScrollPosition from '~/hooks/usePersistentVirtualizedScrollPosition';

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
    const listItemProps: Record<string, any> = {
      className,
      onClick: isInEditMode
        ? onStartEditing.bind(null, missionIndex!)
        : itemId
          ? onSelectedItem.bind(null, itemId)
          : undefined,
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
  // eslint-disable-next-line @typescript-eslint/ban-types
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
  groups: UAVGroup[];
  keyboardNav: KeyboardNavigationHandlers;
  layout: UAVListLayout;
  mappingSlotBeingEdited: number;
  onEditMappingSlot: (missionIndex: number) => void;
  onMappingAdjusted: (args: { uavId: string; to: Nullable<number> }) => void;
  onSelectItem: (id: string) => void;
  onSelectSection: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selection: string[];
  selectionInfo: GroupSelectionInfo[];
  showMissionIds: boolean;
}>;

/**
 * Presentation component for showing the drone show configuration view.
 */
const UAVListPresentation = ({
  containerDOMNodeId,
  editingMapping,
  groups,
  keyboardNav,
  layout,
  mappingSlotBeingEdited,
  onEditMappingSlot,
  onMappingAdjusted,
  onSelectItem,
  onSelectSection,
  selection,
  selectionInfo,
  showMissionIds,
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

  // TODO: get rid of flickering when switching between mapping editor mode and
  // normal mode
  const propsForScrolling = usePersistentVirtualizedScrollPosition();

  const itemRendererOptions: ItemRendererOptions = {
    className: classes.listItem,
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

  const mainBox = (
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
        {/* <Box> is positioned relative so it becomes an anchor for the positioning of the header */}
        <SortAndFilterHeader />
        {/* We assume that each grid item is a <div> in the <Box> when we
         * calculate how many columns there are in the grid. Revise the
         * layout functions in connect() if this is not the case any more */}
        <VirtualizedUAVListBody
          id={containerDOMNodeId}
          groups={groups}
          itemRenderer={itemRenderer}
          layout={layout}
          selectionInfo={selectionInfo}
          onSelectSection={onSelectSection}
          {...propsForScrolling}
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
    groups: getDisplayedGroups(state),
    mappingSlotBeingEdited: getIndexOfMappingSlotBeingEdited(state),
    layout: getUAVListLayout(state),
    selection: getSelection(state),
    selectionInfo: getSelectionInfo(state),
    showMissionIds: isShowingMissionIds(state),
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
      direction: Direction
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

          // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
          default:
            return 0;
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const maybeOpenUAVDetailsDialog = (globalId: string) => {
      const uavId = globalIdToUavId(globalId);
      if (uavId) {
        return openUAVDetailsDialog(uavId);
      }
    };

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    return (dispatch) => ({
      containerDOMNodeId,

      // TODO(ntamas): keyboard navigation does not work with the virtualized
      // layout yet; setFocusToId() is not able to scroll to the item when it
      // does not have a DOM node yet

      keyboardNav: createKeyboardNavigationHandlers({
        dispatch,
        activateId: maybeOpenUAVDetailsDialog,
        getNavigationDeltaInDirection,
        getVisibleIds: getAllGlobalIdsInDisplayedGroups,
        getSelectedIds: getSelectedUAVIdsAndMissionSlotIds,
        setSelectedIds: setSelection,
        setFocusToId: (id: string) => `#${globalIdToDOMNodeId(id)}`,
      }),

      ...bindActionCreators(
        {
          onEditMappingSlot: startMappingEditorSessionAtSlot,
          onMappingAdjusted: adjustMissionMapping,
          onSelectItem: createSelectionHandlerThunk({
            activateItem: maybeOpenUAVDetailsDialog,
            getSelection: getSelectedUAVIdsAndMissionSlotIds,
            setSelection,
            getListItems: getAllGlobalIdsInDisplayedGroups,
          }) as any as (id: string) => AnyAction,
          onSelectSection:
            (event: React.ChangeEvent<HTMLInputElement>): AppThunk =>
            (dispatch, getState) => {
              const { value } = event.target;
              const state = getState();
              let index = 0;

              for (const group of getDisplayedGroups(state)) {
                if (group.id === value) {
                  const selectedUAVIds = getSelectedUAVIds(state);
                  const selectionInfo = getSelectionInfo(state)[index];
                  const displayedIds = getUAVIdsInDisplayedGroups(state)[index];

                  if (selectionInfo && displayedIds) {
                    const newSelection = selectionInfo.checked
                      ? difference(selectedUAVIds, displayedIds)
                      : union(selectedUAVIds, displayedIds);

                    // This will deselect objects of any other type, but this is
                    // exactly what we want
                    dispatch(setSelectedUAVIds(newSelection));
                  }

                  break;
                }

                index++;
              }
            },
        },
        dispatch
      ),
    });
  }
)(UAVListPresentation);

export default UAVList;
