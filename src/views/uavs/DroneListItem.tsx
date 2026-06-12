/* eslint-disable @typescript-eslint/naming-convention */
import type { Theme } from '@mui/material/styles';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { useDrag, useDrop, type ConnectableElement } from 'react-dnd';

import { isThemeDark, makeStyles } from '@skybrush/app-theme-mui';

import Colors from '~/components/colors';

import { GRID_ITEM_WIDTH } from './constants';
import { uavIdToDOMNodeId } from './utils';

const accentColor = '#6eb6ff';
const accentGlow = 'rgba(110, 182, 255, 0.35)';

const useStyles = makeStyles((theme: Theme) => {
  const dark = isThemeDark(theme);
  const selectedBg = dark ? 'rgba(47, 128, 237, 0.14)' : 'rgba(47, 128, 237, 0.1)';
  const hoverBg = dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';

  return {
    root: {
      alignItems: 'center',
      border: '1px solid transparent',
      borderRadius: theme.spacing(1),
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      minWidth: GRID_ITEM_WIDTH,
      padding: theme.spacing(0.5, 0.75),
      position: 'relative',

      scrollMarginTop:
        '3em' /* to account for the hovering header in the list view */,
    },

    draggable: {
      '&:hover': {
        borderColor: dark ? 'rgba(255, 255, 255, 0.12)' : theme.palette.divider,
        boxShadow: theme.shadows[4],
      },
    },

    selectable: {
      '&:hover': {
        backgroundColor: hoverBg,
        borderColor: dark ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider,
      },
    },

    selected: {
      backgroundColor: selectedBg,
      borderColor: dark ? 'rgba(110, 182, 255, 0.45)' : theme.palette.primary.main,
      boxShadow: `0 0 0 1px ${accentGlow}, 0 4px 14px rgba(0, 0, 0, 0.18)`,
      '&:hover': {
        backgroundColor: selectedBg,
        borderColor: dark ? accentColor : theme.palette.primary.main,
      },
    },

    selectedStretch: {
      boxShadow: `inset 3px 0 0 ${accentColor}, 0 0 0 1px ${accentGlow}`,
    },

    fill: {
      flexGrow: 1,
      padding: theme.spacing(2, 0),
    },

    stretch: {
      alignItems: 'center',
      borderRadius: 0,
      flexDirection: 'row',
      minWidth: 0,
      padding: theme.spacing(0, 1),
      width: '100%',
    },

    gridHost: {
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      minWidth: 0,
      padding: 0,
      width: '100%',
    },
  };
});

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
}: DragDropAreaProps): React.JSX.Element => {
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
    variant?: 'default' | 'grid';
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
  variant = 'default',
}: DroneListItemProps): React.JSX.Element => {
  const classes = useStyles();
  const isGrid = variant === 'grid';
  const mergedClassNames = clsx(
    classes.root,
    className,
    isGrid && classes.gridHost,
    onClick && classes.selectable,
    draggable && classes.draggable,
    selected && !isGrid && classes.selected,
    selected && stretch && classes.selectedStretch,
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
