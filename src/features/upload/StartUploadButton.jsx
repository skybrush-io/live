import PropTypes from 'prop-types';
import React from 'react';
import { Translation } from 'react-i18next';

import Button from '@material-ui/core/Button';
import PlayArrow from '@material-ui/icons/PlayArrow';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

/**
 * Presentation component for the button that allows the user to start the
 * upload for the drones in the backlog (if any) or for all the drones in the
 * current mission.
 */
const StartUploadButton = ({ hasQueuedItems, ...rest }) => (
  <Translation>
    {(t) => (
      <Tooltip content={t('startUploadButton.tooltip')}>
        <Button startIcon={<PlayArrow />} {...rest}>
          {hasQueuedItems
            ? t('startUploadButton.startSelected')
            : t('general.action.start')}
        </Button>
      </Tooltip>
    )}
  </Translation>
);

StartUploadButton.propTypes = {
  hasQueuedItems: PropTypes.bool,
};

export default StartUploadButton;
