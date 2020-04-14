import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

const FormHeader = ({ children, disablePadding, ...rest }) => (
  <Box color='text.secondary' mt={disablePadding ? 0 : 2} mb={0.5} {...rest}>
    <Typography variant='button' component='span'>
      {children}
    </Typography>
  </Box>
);

FormHeader.propTypes = {
  children: PropTypes.node,
  disablePadding: PropTypes.bool,
};

export default FormHeader;
