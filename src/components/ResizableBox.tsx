import Box, { type BoxProps } from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';
import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { Resizable, type Props as ResizableProps } from 'react-resizable';

import { makeStyles } from '@skybrush/app-theme-mui';

type SideAxis = 'width' | 'height';
type Edge = 'top' | 'right' | 'bottom' | 'left';
type SideCursor = 'ns' | 'ew';
type CornerCursor = 'nesw' | 'nwse';

const makeSideClass = (
  major: SideAxis,
  minor: SideAxis,
  edge: Edge,
  across: Edge,
  cursor: SideCursor,
  theme: Theme
) => ({
  [major]: 50,
  [minor]: 15,
  [edge]: 5,
  [across]: '50%',

  cursor: `${cursor}-resize`,

  '&:after': {
    [edge]: 5,
    [across]: '-50%',
    [`border-${edge}`]: `5px dotted ${theme.palette.action.selected}`,
  },
});

const makeCornerClass = (
  edge1: Edge,
  edge2: Edge,
  cursor: CornerCursor,
  theme: Theme
) => ({
  width: 20,
  height: 20,

  [edge1]: 5,
  [edge2]: 5,

  cursor: `${cursor}-resize`,

  '&:after': {
    [edge1]: 5,
    [edge2]: 5,

    [`border-${edge1}`]: `5px dotted ${theme.palette.action.selected}`,
    [`border-${edge2}`]: `5px dotted ${theme.palette.action.selected}`,
  },
});

const useStyles = makeStyles((theme) => ({
  handle: {
    position: 'absolute',

    '&:after': {
      content: '""',
      display: 'block',

      width: '100%',
      height: '100%',

      position: 'relative',
    },
  },

  'handle-n': makeSideClass('width', 'height', 'top', 'left', 'ns', theme),
  'handle-e': makeSideClass('height', 'width', 'right', 'top', 'ew', theme),
  'handle-s': makeSideClass('width', 'height', 'bottom', 'left', 'ns', theme),
  'handle-w': makeSideClass('height', 'width', 'left', 'top', 'ew', theme),

  'handle-ne': makeCornerClass('top', 'right', 'nesw', theme),
  'handle-se': makeCornerClass('bottom', 'right', 'nwse', theme),
  'handle-sw': makeCornerClass('bottom', 'left', 'nesw', theme),
  'handle-nw': makeCornerClass('top', 'left', 'nwse', theme),
}));

type ResizeHandleProps = {
  handleAxis: 'n' | 'e' | 's' | 'w' | 'ne' | 'se' | 'sw' | 'nw';
} & BoxProps;

const ResizeHandle = ({ ref, handleAxis, ...rest }: ResizeHandleProps) => {
  const classes = useStyles();
  return (
    <Box
      ref={ref}
      className={clsx(classes.handle, classes[`handle-${handleAxis}`])}
      {...rest}
    />
  );
};

type Size = { width: number; height: number };

type ResizableBoxProps = Omit<
  ResizableProps,
  'children' | 'handle' | 'height' | 'onResize' | 'width'
> & {
  boxProps?: BoxProps;
  children?: React.ReactNode;
  initialSize: Size;
};

/**
 * Resizable box component, copied over from v1 of `@skysbrush/mui-components`
 * and updated to be compatible with MUI v5.
 */
const ResizableBox = ({
  boxProps,
  children,
  initialSize,
  ...rest
}: ResizableBoxProps) => {
  const [size, setSize] = useState(initialSize);

  // TODO: Call the external `onResize` handler if present.
  const onResize = useCallback(
    (_event: React.SyntheticEvent, { size }: { size: Size }) => {
      setSize(size);
    },
    []
  );

  return (
    <Resizable
      width={size.width}
      height={size.height}
      handle={<ResizeHandle handleAxis='se' />}
      // TODO: Prevent the external `onResize` handler from overriding this.
      onResize={onResize}
      {...rest}
    >
      <Box
        {...boxProps}
        sx={[
          {
            width: size.width,
            height: size.height,
            position: 'relative',
          },
          ...(Array.isArray(boxProps?.sx) ? boxProps.sx : [boxProps?.sx]),
        ]}
      >
        {children}
      </Box>
    </Resizable>
  );
};

export default ResizableBox;
