import { useCallback, useEffect } from 'react';

type Props = {
  filename?: string | null;
  onChanged?: () => void;
  onRemoved?: () => void;
};

/**
 * Component that receives a filename and a callback as a prop, and calls the
 * callback whenever the given file changes.
 */
const FileWatcher = ({ filename, onChanged, onRemoved }: Props) => {
  const onChangedOrRemoved = useCallback(
    (event: 'update' | 'remove') => {
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
