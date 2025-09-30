/**
 * @file Generic component that represents a widget floating on top of the
 * map view in the main window.
 *
 * In a future version, the user will probably be given the option to move
 * widgets around or close them.
 */

import Paper from '@mui/material/Paper';
import PropTypes from 'prop-types';
import React from 'react';

const Widget = ({ children, style }) => (
  <Paper className='widget' style={style}>
    {children}
  </Paper>
);

Widget.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  style: PropTypes.object,
};

export default Widget;
