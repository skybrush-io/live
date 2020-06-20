import { useCallback, useEffect } from 'react';

/**
 * Component that receives a filename and a callback as a prop, and calls the
 * callback whenever the given file changes.
 */
const FileWatcher = ({ filename, onChanged, onRemoved }) => {
  const onChangedOrRemoved = useCallback(
    (event, _) => {
      if (event === 'update') {
        if (onChanged) {
          onChanged();
        }
      } else if (event === 'remove') {
        if (onRemoved) {
          onRemoved();
        }
      }
    },
    [onChanged, onRemoved]
  );

  useEffect(() => {
    if (window.bridge && filename) {
      return window.bridge.watchFile(filename, onChangedOrRemoved);
    }
  }, [filename, onChangedOrRemoved]);

  return null;
};

export default FileWatcher;
