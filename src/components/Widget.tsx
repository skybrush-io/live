/**
 * @file Generic component that represents a widget floating on top of the
 * map view in the main window.
 *
 * In a future version, the user will probably be given the option to move
 * widgets around or close them.
 */

import Paper from '@mui/material/Paper';
import type React from 'react';

type Props = {
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

const Widget = ({ children, style }: Props) => (
  <Paper className='widget' style={style}>
    {children}
  </Paper>
);

export default Widget;
