import PropTypes from 'prop-types';
import React from 'react';

import Button from '@material-ui/core/Button';
import PlayArrow from '@material-ui/icons/PlayArrow';

/**
 * Presentation component for the button that allows the user to start the
 * upload for the drones in the backlog (if any) or for all the drones in the
 * current mission.
 */
const StartUploadButton = ({ hasQueuedItems, ...rest }) => (
  <Button startIcon={<PlayArrow />} {...rest}>
    {hasQueuedItems ? 'Start selected' : 'Start'}
  </Button>
);

StartUploadButton.propTypes = {
  hasQueuedItems: PropTypes.bool,
};

export default StartUploadButton;
