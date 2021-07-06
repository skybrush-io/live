import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { makeStyles } from '@material-ui/core/styles';

import Colors from '~/components/colors';

import { uavIdToDOMNodeId } from './utils';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      alignItems: 'center',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      minWidth: theme.spacing(10),
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
      alignItems: ['stretch', '!important'],
    },
  }),
  {
    name: 'DroneListItem',
  }
);

const hideItem = { style: { opacity: 0 } };
const addDropIndicator = {
  style: { backgroundColor: Colors.dropTarget },
};

/**
 * Component that encapsulates the logic required to handle drag-and-drop
 * gestures in a list item.
 */
const DragDropArea = ({ children, id, onDrop, ...rest }) => {
  const [collectedDragProps, drag] = useDrag({
    item: { id },
    type: 'uav',
    collect: (monitor) => monitor.isDragging() && hideItem,
  });

  const [collectedDropProps, drop] = useDrop({
    accept: 'uav',
    canDrop: (item) => id !== item.id,
    collect: (monitor) =>
      monitor.isOver() && monitor.canDrop() && addDropIndicator,
    drop: onDrop ? (item) => onDrop(item.id) : undefined,
  });

  const ref = useCallback(
    (value) => {
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

DragDropArea.propTypes = {
  children: PropTypes.node,
  id: PropTypes.string,
  onDrop: PropTypes.func,
};

const DroneListItem = ({
  children,
  draggable,
  fill,
  onClick,
  onDrop,
  selected,
  stretch,
  uavId,
}) => {
  const classes = useStyles();
  const mergedClassNames = clsx(
    classes.root,
    onClick && classes.selectable,
    draggable && classes.draggable,
    selected && classes.selected,
    fill && classes.fill,
    stretch && classes.stretch
  );
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

DroneListItem.propTypes = {
  children: PropTypes.node,
  draggable: PropTypes.bool,
  fill: PropTypes.bool,
  onClick: PropTypes.func,
  onDrop: PropTypes.func,
  selected: PropTypes.bool,
  stretch: PropTypes.bool,
  uavId: PropTypes.string,
};

export default DroneListItem;
