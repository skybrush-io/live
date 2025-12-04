import PlayArrow from '@mui/icons-material/PlayArrow';
import Button, { type ButtonProps } from '@mui/material/Button';
import type React from 'react';
import { Translation } from 'react-i18next';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';

type StartUploadButtonProps = Readonly<{
  hasQueuedItems?: boolean;
}> &
  ButtonProps;

/**
 * Presentation component for the button that allows the user to start the
 * upload for the drones in the backlog (if any) or for all the drones in the
 * current mission.
 */
const StartUploadButton = ({
  hasQueuedItems,
  ...rest
}: StartUploadButtonProps): React.JSX.Element => (
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

export default StartUploadButton;
