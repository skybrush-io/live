import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { makeStyles } from '@material-ui/core/styles';

import Colors from '~/components/colors';

const useStyles = makeStyles(
  theme => ({
    root: {
      alignItems: 'center',
      cursor: 'hand',
      display: 'flex',
      flexDirection: 'column',
      padding: theme.spacing(1),
      minWidth: theme.spacing(10),

      '& div': {
        marginBottom: theme.spacing(0.5)
      },
      '& div:last-child': {
        marginBottom: 0
      },
      transition: theme.transitions.create(['background-color', 'box-shadow'])
    },

    draggable: {
      '&:hover': {
        boxShadow: theme.shadows[4]
      }
    },

    selectable: {
      '&:hover': {
        backgroundColor: theme.palette.action.hover
      }
    },

    selected: {
      backgroundColor: theme.palette.action.selected,
      '&:hover': {
        backgroundColor: theme.palette.action.selected
      }
    }
  }),
  {
    name: 'DroneListItem'
  }
);

const hideItem = { style: { opacity: 0 } };
const addDropIndicator = {
  style: { backgroundColor: Colors.dropTarget }
};

const DragDropArea = ({ children, id, onDrop, ...rest }) => {
  const [collectedDragProps, drag] = useDrag({
    item: { id, type: 'uav' },
    collect: monitor => monitor.isDragging() && hideItem
  });

  const [collectedDropProps, drop] = useDrop({
    accept: 'uav',
    canDrop: item => id !== item.id,
    collect: monitor =>
      monitor.isOver() && monitor.canDrop() && addDropIndicator,
    drop: onDrop ? item => onDrop(item.id) : undefined
  });

  const ref = useCallback(
    value => {
      drag(value);
      drop(value);
    },
    [drag, drop]
  );

  return (
    <div ref={ref} {...rest} {...collectedDragProps} {...collectedDropProps}>
      {children}
    </div>
  );
};

DragDropArea.propTypes = {
  children: PropTypes.node,
  id: PropTypes.string,
  onDrop: PropTypes.func
};

const DroneListItem = ({
  children,
  draggable,
  onClick,
  onDrop,
  selected,
  uavId
}) => {
  const classes = useStyles();
  const className = clsx(
    classes.root,
    onClick && classes.selectable,
    draggable && classes.draggable,
    selected && classes.selected
  );
  return draggable || onDrop ? (
    <DragDropArea className={className} id={uavId} onDrop={onDrop}>
      {children}
    </DragDropArea>
  ) : (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
};

DroneListItem.propTypes = {
  children: PropTypes.node,
  draggable: PropTypes.bool,
  onClick: PropTypes.func,
  onDrop: PropTypes.func,
  selected: PropTypes.bool,
  uavId: PropTypes.string
};

export default DroneListItem;
