import Box, { type BoxProps } from '@mui/material/Box';

type OverlayProps = BoxProps;

/**
 * Overlay that can be placed on top of the 3D view in order to show some
 * HTML components.
 */
const Overlay = ({ children, sx, ...rest }: OverlayProps) => (
  <Box
    {...rest}
    sx={{
      position: 'absolute',
      zIndex: 1,
      ...sx,
    }}
  >
    {children}
  </Box>
);

export default Overlay;
