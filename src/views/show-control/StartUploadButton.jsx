import React from 'react';

import Button from '@material-ui/core/Button';
import CloudUpload from '@material-ui/icons/CloudUpload';

/**
 * Presentation component for the button that allows the user to start the
 * upload for the drones in the backlog (if any) or for all the drones in the
 * current mission.
 */
const StartUploadButton = (props) => (
  <Button startIcon={<CloudUpload />} {...props}>
    Start
  </Button>
);

export default StartUploadButton;
