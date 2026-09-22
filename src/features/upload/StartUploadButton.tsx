import PlayArrow from '@mui/icons-material/PlayArrow';
import Button, { type ButtonProps } from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { useAppDispatch } from '~/store/hooks';

import { startUploadJobFromUploadDialog } from './actions';
import { hasHiddenTargets, hasQueuedItems } from './selectors';

/**
 * Presentation component for the button that allows the user to start the
 * upload for the drones in the backlog (if any) or for all the drones in the
 * current mission.
 */
const StartUploadButton = (props: ButtonProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const hasHidden = useSelector(hasHiddenTargets);
  const hasQueued = useSelector(hasQueuedItems);

  return (
    <Tooltip content={t('startUploadButton.tooltip')}>
      <Button
        startIcon={<PlayArrow />}
        onClick={() => {
          dispatch(startUploadJobFromUploadDialog());
        }}
        color={hasHidden ? 'warning' : undefined}
        {...props}
      >
        {hasQueued
          ? t('startUploadButton.startSelected')
          : t('general.action.start')}
      </Button>
    </Tooltip>
  );
};

export default StartUploadButton;
