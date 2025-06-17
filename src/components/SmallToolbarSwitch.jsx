import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';

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
