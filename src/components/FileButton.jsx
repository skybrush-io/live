import PropTypes from 'prop-types';
import React, { useCallback, useRef, useState } from 'react';

import Button from '@material-ui/core/Button';

/**
 * Button that triggers a file upload dialog when clicked.
 */
const FileButton = ({
  accepts,
  extensions,
  id,
  multiple,
  onSelected,
  onSelectionFailed,
  ...rest
}) => {
  const inputRef = useRef();

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

  const handleClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  const inputId = id ? `${id}-input` : undefined;

  return (
    <>
      <input
        key={generation}
        ref={inputRef}
        accept={
          extensions
            ? extensions.map((ext) => `.${ext.toLowerCase()}`)
            : undefined
        }
        type='file'
        id={inputId}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(event) => onHandleSelection(event.target)}
      />
      <label id={id} htmlFor={inputId}>
        <Button {...rest} onClick={handleClick} />
      </label>
    </>
  );
};

FileButton.propTypes = {
  accepts: PropTypes.func,
  extensions: PropTypes.arrayOf(PropTypes.string),
  id: PropTypes.string,
  multiple: PropTypes.bool,
  onSelected: PropTypes.func,
  onSelectionFailed: PropTypes.func,
};

export default FileButton;
