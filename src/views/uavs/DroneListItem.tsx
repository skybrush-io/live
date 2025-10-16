/* eslint-disable @typescript-eslint/naming-convention */
import type { Theme } from '@mui/material/styles';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { useDrag, useDrop, type ConnectableElement } from 'react-dnd';

import { makeStyles } from '@skybrush/app-theme-mui';

import Colors from '~/components/colors';

import { GRID_ITEM_WIDTH } from './constants';
import { uavIdToDOMNodeId } from './utils';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    alignItems: 'center',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    minWidth: GRID_ITEM_WIDTH,
    position: 'relative',

    scrollMarginTop:
      '3em' /* to account for the hovering header in the list view */,

    // Transitions disabled because it makes hard to follow which item is
    // selected when the user is holding down a keyboard navigation key
    // continuously.
    // transition: theme.transitions.create(['background-color', 'box-shadow']),
  },

  draggable: {
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
  },

  selectable: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },

  selected: {
    backgroundColor: theme.palette.action.selected,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },

  fill: {
    flexGrow: 1,
    padding: theme.spacing(2, 0),
  },

  stretch: {
    alignItems: ['stretch', '!important'] as any as string,
  },
}));

const hideItem = { style: { opacity: 0 } };
const addDropIndicator = {
  style: { backgroundColor: Colors.dropTarget },
};

type DragDropAreaProps = React.PropsWithChildren<
  Readonly<{
    id?: string;
    onDrop?: (id: string) => void;
  }>
> &
  Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrop'>;

/**
 * Component that encapsulates the logic required to handle drag-and-drop
 * gestures in a list item.
 */
const DragDropArea = ({
  children,
  id,
  onDrop,
  ...rest
}: DragDropAreaProps): JSX.Element => {
  const [collectedDragProps, drag] = useDrag({
    item: { id },
    type: 'uav',
    collect: (monitor) => monitor.isDragging() && hideItem,
  });

  const [collectedDropProps, drop] = useDrop({
    accept: 'uav',
    canDrop: (item: { id: string }) => id !== item.id,
    collect: (monitor) =>
      monitor.isOver() && monitor.canDrop() && addDropIndicator,
    drop: onDrop
      ? (item: { id: string }): void => {
          onDrop(item.id);
        }
      : undefined,
  });

  const ref = useCallback(
    (value: ConnectableElement) => {
      drag(value);
      drop(value);
    },
    [drag, drop]
  );

  return (
    <div
      ref={ref}
      id={uavIdToDOMNodeId(id)}
      {...rest}
      {...collectedDragProps}
      {...collectedDropProps}
    >
      {children}
    </div>
  );
};

export type DroneListItemProps = React.PropsWithChildren<
  Readonly<{
    className?: string;
    draggable?: boolean;
    fill?: boolean;
    onClick?: () => void;
    onDrop?: (id: string) => void;
    selected?: boolean;
    stretch?: boolean;
    uavId?: string;
  }>
>;

const DroneListItem = ({
  children,
  className,
  draggable,
  fill,
  onClick,
  onDrop,
  selected,
  stretch,
  uavId,
}: DroneListItemProps): JSX.Element => {
  const classes = useStyles();
  const mergedClassNames = clsx(
    classes.root,
    className,
    onClick && classes.selectable,
    draggable && classes.draggable,
    selected && classes.selected,
    fill && classes.fill,
    stretch && classes.stretch
  );
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  return draggable || onDrop ? (
    <DragDropArea
      className={mergedClassNames}
      id={uavId}
      onClick={onClick}
      onDrop={onDrop}
    >
      {children}
    </DragDropArea>
  ) : (
    <div
      id={uavIdToDOMNodeId(uavId)}
      className={mergedClassNames}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default DroneListItem;
