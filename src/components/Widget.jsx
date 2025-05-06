/**
 * @file Generic component that represents a widget floating on top of the
 * map view in the main window.
 *
 * In a future version, the user will probably be given the option to move
 * widgets around or close them.
 */

import PropTypes from 'prop-types';
import React from 'react';

import Paper from '@material-ui/core/Paper';

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

Widget.defaultProps = {
  children: [],
  style: {},
};

export default Widget;
