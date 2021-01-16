import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import { Status } from './semantics';
import StatusLight from './StatusLight';

const LabeledStatusLight = ({ children, color, size, status, ...rest }) => (
  <Box
    alignItems='center'
    flex={1}
    display='flex'
    flexDirection='row'
    {...rest}
  >
    <StatusLight inline size={size} status={status} />
    <Box pl={1}>
      <Typography
        noWrap
        variant={size === 'small' ? 'body2' : 'body1'}
        color={color}
      >
        {children}
      </Typography>
    </Box>
  </Box>
);

LabeledStatusLight.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  color: PropTypes.string,
  size: PropTypes.oneOf(['small', 'normal', 'large']),
  status: PropTypes.oneOf(Object.values(Status)),
};

LabeledStatusLight.defaultProps = {
  color: 'textPrimary',
  size: 'normal',
};

export default LabeledStatusLight;
