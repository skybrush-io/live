import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';

import Button from '@material-ui/core/Button';

/**
 * Button that triggers a file upload dialog when clicked.
 */
const FileButton = React.forwardRef(
  (
    {
      accepts,
      children,
      filter,
      multiple,
      onSelected,
      onSelectionFailed,
      ...rest
    },
    ref
  ) => {
    // This state variable will be used to force-clear the file input when the
    // user selects a file, then attempts to select it again later. If we did not
    // do this, the second selection would not succeed because no change event
    // would be fired.
    const [generation, setGeneration] = useState(0);

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

        setGeneration(generation + 1);
      },
      [accepts, generation, multiple, onSelected, onSelectionFailed]
    );

    return (
      <Button ref={ref} component='label' {...rest}>
        <input
          key={generation}
          hidden
          type='file'
          accept={filter}
          multiple={multiple}
          onChange={(event) => onHandleSelection(event.target)}
        />
        {children}
      </Button>
    );
  }
);

FileButton.propTypes = {
  accepts: PropTypes.func,
  children: PropTypes.node,
  filter: PropTypes.arrayOf(PropTypes.string),
  multiple: PropTypes.bool,
  onSelected: PropTypes.func,
  onSelectionFailed: PropTypes.func,
};

export default FileButton;
