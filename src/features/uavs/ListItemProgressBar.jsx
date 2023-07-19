import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';

import LinearProgress from '@material-ui/core/LinearProgress';

const ListItemProgressBar = ({ progress }) => {
  const { percentage } = progress || {};

  if (isNil(percentage)) {
    return <LinearProgress value={null} variant='indeterminate' />;
  } else if (
    typeof percentage === 'number' &&
    percentage >= 0 &&
    percentage < 100
  ) {
    return <LinearProgress value={percentage} variant='determinate' />;
  } else {
    return null;
  }
};

ListItemProgressBar.propTypes = {
  progress: PropTypes.shape({
    percentage: PropTypes.number,
    message: PropTypes.string,
  }),
};

export default ListItemProgressBar;
