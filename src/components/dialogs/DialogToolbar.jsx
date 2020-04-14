import PropTypes from 'prop-types';
import React from 'react';

import Toolbar from '@material-ui/core/Toolbar';

import DialogAppBar from './DialogAppBar';

/**
 * toolbar component styled appropriately to be suitable for presentation in the
 * header of a dialog.
 */
const DialogToolbar = ({ children, ...rest }) => (
  <DialogAppBar>
    <Toolbar variant='dense' {...rest}>
      {children}
    </Toolbar>
  </DialogAppBar>
);

DialogToolbar.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};

export default DialogToolbar;
