import Button from '@mui/material/Button';
import makeStyles from '@mui/styles/makeStyles';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend, NativeTypes } from 'react-dnd-html5-backend';

import { multiRef } from '~/utils/react';

const useStyles = makeStyles((theme) => ({
  dragHover: { background: theme.palette.action.hover },
}));

/**
 * Button that triggers a file upload dialog when clicked.
 * Also supports selection through drag & drop operations.
 */
const FileButton = React.forwardRef(
  (
    {
      accepts,
      children,
      component: Component = Button,
      componentProps,
      filter,
      multiple,
      onSelected,
      onSelectionFailed,
      ...rest
    },
    ref
  ) => {
    const classes = useStyles();

    // This state variable will be used to force-clear the file input when the
    // user selects a file, then attempts to select it again later. If we did not
    // do this, the second selection would not succeed because no change event
    // would be fired.
    const [generation, setGeneration] = useState(0);

    const onHandleSelection = useCallback(
      (sel) => {
        const fileOrFiles = multiple ? sel?.files : sel?.files?.[0];

        if (fileOrFiles) {
          const action =
            !accepts || accepts(fileOrFiles) ? onSelected : onSelectionFailed;
          action?.(fileOrFiles);

          setGeneration(generation + 1);
        }
      },
      [accepts, generation, multiple, onSelected, onSelectionFailed]
    );

    const [collectedProps, dropRef] = useDrop({
      accept: [NativeTypes.FILE],
      // WARN: ReactDND seems to have been unmaintained for the last two years
      // and handles information present during drag operations inconsistently
      // across browsers, so we avoid trying to use custom logic for `canDrop`
      collect: (monitor) => ({
        ...(monitor.isOver() && { className: classes.dragHover }),
      }),
      drop: onHandleSelection,
    });

    return (
      <Component
        ref={multiRef([ref, dropRef])}
        component='label'
        {...collectedProps}
        {...componentProps}
        {...rest}
      >
        <input
          key={generation}
          hidden
          type='file'
          accept={filter}
          multiple={multiple}
          onChange={(event) => onHandleSelection(event.target)}
        />
        {children}
      </Component>
    );
  }
);

FileButton.propTypes = {
  accepts: PropTypes.func,
  children: PropTypes.node,
  component: PropTypes.elementType,
  componentProps: PropTypes.object,
  filter: PropTypes.arrayOf(PropTypes.string),
  multiple: PropTypes.bool,
  onSelected: PropTypes.func,
  onSelectionFailed: PropTypes.func,
};

export default React.forwardRef((props, ref) => (
  <DndProvider backend={HTML5Backend}>
    <FileButton ref={ref} {...props} />
  </DndProvider>
));
