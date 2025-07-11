import Box from '@mui/material/Box';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Overlay that can be placed on top of the 3D view in order to show some
 * HTML components.
 */
const Overlay = ({ children, ...rest }) => (
  <Box position='absolute' zIndex={1} {...rest}>
    {children}
  </Box>
);

Overlay.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
};

export default Overlay;
