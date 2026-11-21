import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import { formatMissionId } from '~/utils/formatting';

import type { ShowHealingResult } from './slice';

type ShowHealingStatusProps = {
  problemKey: string | null;
  result: ShowHealingResult;
};

/**
 * Status area of the show healing dialog that shows the problem with the
 * selected drones, the progress of the calculation or its result.
 */
const ShowHealingStatus = ({ problemKey, result }: ShowHealingStatusProps) => {
  const { t } = useTranslation();

  if (problemKey !== null) {
    return (
      <Alert severity='warning' variant='outlined'>
        {t(problemKey)}
      </Alert>
    );
  }

  switch (result.status) {
    case 'loading':
      return (
        <>
          <Typography variant='body2' color='text.secondary' sx={{ pb: 1 }}>
            {t('showHealingDialog.calculating')}
          </Typography>
          <LinearProgress />
        </>
      );

    case 'error':
      return (
        <Alert severity='error' variant='outlined'>
          {result.error}
        </Alert>
      );

    case 'ready':
      return (
        <Alert severity='success' variant='outlined'>
          {t('showHealingDialog.review', {
            showId: formatMissionId(result.missionIndex),
            uavId: result.uavId,
            startTime: result.startTime,
          })}
        </Alert>
      );

    default:
      return (
        <Typography variant='body2' color='text.secondary'>
          {t('showHealingDialog.selectDrones')}
        </Typography>
      );
  }
};

export default ShowHealingStatus;
