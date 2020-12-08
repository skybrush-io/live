import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import Tabs from '@material-ui/core/Tabs';

import DialogAppBar from './DialogAppBar';

const alignmentProps = {
  center: { centered: true },
  justify: {
    centered: true,
    variant: 'fullWidth',
  },
};

/**
 * Tab component styled appropriately to be suitable for presentation in the
 * header of a dialog.
 */
const DialogTabs = ({ alignment, children, dragHandle, ...rest }) => (
  <DialogAppBar style={dragHandle ? { flexDirection: 'row' } : null}>
    <Tabs {...alignmentProps[dragHandle ? 'draggable' : alignment]} {...rest}>
      {children}
    </Tabs>
    {dragHandle && <Box flex={1} id={dragHandle} style={{ cursor: 'move' }} />}
  </DialogAppBar>
);

DialogTabs.propTypes = {
  alignment: PropTypes.oneOf(['left', 'center', 'justify']),
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]),
  dragHandle: PropTypes.string,
};

DialogTabs.defaultProps = {
  alignment: 'justify',
};

export default DialogTabs;
