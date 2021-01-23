import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import CircularProgress from '@material-ui/core/CircularProgress';
import Fade from '@material-ui/core/Fade';
import Typography from '@material-ui/core/Typography';

const SmallProgressIndicator = ({ label, visible, ...rest }) => (
  <Fade in={visible}>
    <Box
      alignItems='center'
      flex={1}
      padding={1}
      display='flex'
      flexDirection='row'
      overflow='hidden'
      {...rest}
    >
      <Box pr={1}>
        <CircularProgress color='secondary' size={16} />
      </Box>
      <Typography noWrap variant='body2' color='textSecondary'>
        {label}
      </Typography>
    </Box>
  </Fade>
);

SmallProgressIndicator.propTypes = {
  label: PropTypes.string,
  visible: PropTypes.bool,
};

SmallProgressIndicator.defaultProps = {
  visible: true,
};

export default SmallProgressIndicator;
