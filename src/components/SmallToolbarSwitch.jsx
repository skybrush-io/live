import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';

const SmallToolbarSwitch = React.forwardRef(
  ({ label, labelColor, ...rest }, ref) => (
    /* Ref is forwarded to the box and not the switch so tooltips appear when
     * hovering over the label as well */
    <Box ref={ref} display='flex' flexDirection='column' alignItems='center'>
      <Box flex={1}>
        <Switch size='small' {...rest} />
      </Box>
      <Box flex={1}>
        <Typography
          variant='caption'
          color={labelColor || 'textSecondary'}
          component='label'
        >
          {label}
        </Typography>
      </Box>
    </Box>
  )
);

SmallToolbarSwitch.propTypes = {
  label: PropTypes.string,
  labelColor: PropTypes.string,
};

export default SmallToolbarSwitch;
