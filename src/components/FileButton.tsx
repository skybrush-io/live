import Button, { type ButtonProps } from '@mui/material/Button';
import type React from 'react';
import { useCallback, useState } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend, NativeTypes } from 'react-dnd-html5-backend';

import { makeStyles } from '@skybrush/app-theme-mui';

import { multiRef } from '~/utils/react';

const useStyles = makeStyles((theme) => ({
  dragHover: { background: theme.palette.action.hover },
}));

type FileSelectionSource = { files?: FileList | null };

type FileButtonBaseProps = Omit<
  ButtonProps,
  'children' | 'component' | 'ref'
> & {
  ref?: React.Ref<HTMLLabelElement>;
  children?: React.ReactNode;
  component?: React.ElementType;
  componentProps?: Record<string, unknown>;
  filter?: string[];
};

type SingleFileButtonProps = FileButtonBaseProps & {
  multiple?: false;
  accepts?: (file: File) => boolean;
  onSelected?: (file: File) => void | Promise<void>;
  onSelectionFailed?: (file: File) => void | Promise<void>;
};

type MultipleFileButtonProps = FileButtonBaseProps & {
  multiple: true;
  accepts?: (files: File[]) => boolean;
  onSelected?: (files: File[]) => void | Promise<void>;
  onSelectionFailed?: (files: File[]) => void | Promise<void>;
};

type FileButtonProps = SingleFileButtonProps | MultipleFileButtonProps;

/**
 * Button that triggers a file upload dialog when clicked.
 * Also supports selection through drag & drop operations.
 */
const FileButton = ({
  ref = null,
  accepts: acceptsProp,
  children,
  component: Component = Button,
  componentProps,
  filter,
  multiple,
  onSelected: onSelectedProp,
  onSelectionFailed: onSelectionFailedProp,
  ...rest
}: FileButtonProps) => {
  const classes = useStyles();

  // This state variable will be used to force-clear the file input when the
  // user selects a file, then attempts to select it again later. If we did not
  // do this, the second selection would not succeed because no change event
  // would be fired.
  const [generation, setGeneration] = useState(0);

  // Normalize the union callbacks to a single internal signature. The casts
  // are safe because `multiple` determines which variant the caller supplied.
  const accepts = acceptsProp as
    ((fileOrFiles: File | File[]) => boolean) | undefined;
  const onSelected = onSelectedProp as
    ((fileOrFiles: File | File[]) => void | Promise<void>) | undefined;
  const onSelectionFailed = onSelectionFailedProp as
    ((fileOrFiles: File | File[]) => void | Promise<void>) | undefined;

  const onHandleSelection = useCallback(
    (sel: FileSelectionSource | null) => {
      const files = sel?.files;
      if (!files || files.length === 0) {
        return;
      }

      const fileOrFiles = multiple ? Array.from(files) : files[0];
      if (fileOrFiles) {
        const action =
          !accepts || accepts(fileOrFiles) ? onSelected : onSelectionFailed;
        void action?.(fileOrFiles);
      }

      setGeneration((value) => value + 1);
    },
    [accepts, multiple, onSelected, onSelectionFailed]
  );

  const [collectedProps, dropRef] = useDrop<
    { files: FileList },
    unknown,
    { className?: string }
  >({
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
        accept={filter?.join(',')}
        multiple={multiple}
        onChange={(event) => onHandleSelection(event.target)}
      />
      {children}
    </Component>
  );
};

const FileButtonWithProvider = ({ ref, ...props }: FileButtonProps) => (
  <DndProvider backend={HTML5Backend}>
    <FileButton ref={ref} {...props} />
  </DndProvider>
);

export default FileButtonWithProvider;
