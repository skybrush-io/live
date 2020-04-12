import Color from 'color';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import HTML5Backend, { NativeTypes } from 'react-dnd-html5-backend';

import ListItem from '@material-ui/core/ListItem';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  input: {
    display: 'none'
  },

  hover: {
    background: theme.palette.action.hover
  },

  hoverError: {
    background: new Color(theme.palette.error.main).alpha(0.5).string()
  }
}));

/**
 * List item that triggers a file upload dialog when clicked.
 */
const FileListItem = ({
  accepts,
  children,
  id,
  multiple,
  onSelected,
  onSelectionFailed,
  ...rest
}) => {
  const classes = useStyles();

  const onHandleSelection = useCallback(
    (item) => {
      item =
        item && item.files ? (multiple ? item.files : item.files[0]) : null;

      if (!item) {
        return;
      }

      if (!accepts || accepts(item)) {
        if (onSelected) {
          onSelected(item);
        }
      } else if (onSelectionFailed) {
        onSelectionFailed(item);
      }
    },
    [accepts, multiple, onSelected, onSelectionFailed]
  );

  const [collectedProps, dropRef] = useDrop({
    accept: [NativeTypes.FILE],
    canDrop: accepts
      ? (item) => {
          if (item.files.length === 0) {
            // special case; this happens during a drag when the user has not
            // dropped the files yet. We cannot inspect the file itself during
            // a drag so we return true.
            return true;
          }

          item = multiple ? item.files : item.files[0];
          return item ? accepts(item) : false;
        }
      : undefined,
    drop: onHandleSelection,
    collect: (monitor) => ({
      className: monitor.isOver()
        ? monitor.canDrop()
          ? classes.hover
          : classes.hoverError
        : undefined
    })
  });

  return (
    <>
      <input
        className={classes.input}
        type="file"
        id={id}
        multiple={multiple}
        onChange={(event) => onHandleSelection(event.target)}
      />
      <label htmlFor={id}>
        <ListItem ref={dropRef} button {...collectedProps} {...rest}>
          {children}
        </ListItem>
      </label>
    </>
  );
};

FileListItem.propTypes = {
  accepts: PropTypes.func,
  children: PropTypes.node,
  id: PropTypes.string.isRequired,
  multiple: PropTypes.bool,
  onSelected: PropTypes.func,
  onSelectionFailed: PropTypes.func
};

export default (props) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <FileListItem {...props} />
    </DndProvider>
  );
};
