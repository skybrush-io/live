import PropTypes from 'prop-types';
import React from 'react';

import Tabs from '@material-ui/core/Tabs';

import DialogAppBar from './DialogAppBar';

/**
 * Tab component styled appropriately to be suitable for presentation in the
 * header of a dialog.
 */
const DialogTabs = ({ children, ...rest }) => (
  <DialogAppBar>
    <Tabs centered variant='fullWidth' {...rest}>
      {children}
    </Tabs>
  </DialogAppBar>
);

DialogTabs.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
};

export default DialogTabs;
