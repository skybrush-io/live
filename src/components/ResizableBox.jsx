import Box from '@mui/material/Box';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { Resizable } from 'react-resizable';

import { makeStyles } from '@skybrush/app-theme-mui';

const makeSideClass = (major, minor, edge, across, cursor, theme) => ({
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

const makeCornerClass = (edge1, edge2, cursor, theme) => ({
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

const useStyles = makeStyles(
  (theme) => ({
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
  }),
);

const ResizeHandle = React.forwardRef(({ handleAxis, ...rest }, ref) => {
  const classes = useStyles();
  return (
    <Box
      ref={ref}
      className={clsx(classes.handle, classes[`handle-${handleAxis}`])}
      {...rest}
    />
  );
});

ResizeHandle.propTypes = {
  handleAxis: PropTypes.string,
};

/**
 * Resizable box component, copied over from v1 of `@skysbrush/mui-components`
 * and updated to be compatible with MUI v5.
 */
const ResizableBox = ({ boxProps, children, initialSize, ...rest }) => {
  const [size, setSize] = useState(initialSize);

  // TODO: Call the external `onResize` handler if present.
  const onResize = useCallback((_event, { size }) => {
    setSize(size);
  }, []);

  return (
    <Resizable
      width={size.width}
      height={size.height}
      handle={<ResizeHandle />}
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
          ...(Array.isArray(boxProps.sx) ? boxProps.sx : [boxProps.sx]),
        ]}
      >
        {children}
      </Box>
    </Resizable>
  );
};

ResizableBox.propTypes = {
  boxProps: PropTypes.object,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  initialSize: PropTypes.object,
};

export default ResizableBox;
