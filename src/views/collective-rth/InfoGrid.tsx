import Box from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';

import { getShowSegment } from '~/features/show/selectors';
import { formatDurationMS } from '~/utils/formatting';

const useInfoGridStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'grid',
    gridTemplateColumns: 'max-content 1fr',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    rowGap: theme.spacing(1),
  },
  sectionHeader: {
    gridColumn: '1 / -1',
    gridColumnEnd: 'span 2',
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    fontWeight: theme.typography.fontWeightBold,
  },
}));

const InfoGrid = () => {
  const { t } = useTranslation();
  const classes = useInfoGridStyles();
  const showSegment = useSelector(getShowSegment);

  return (
    <Box className={classes.root}>
      <Typography className={classes.sectionHeader} variant='body2'>
        {t('collectiveRTHPanel.infoGrid.showSegment.title')}
      </Typography>
      <Typography variant='body2' color='textSecondary'>
        {t('collectiveRTHPanel.infoGrid.showSegment.start')}
      </Typography>
      <Typography variant='body2'>
        {showSegment !== undefined ? formatDurationMS(showSegment[0]) : ''}
      </Typography>
      <Typography variant='body2' color='textSecondary'>
        {t('collectiveRTHPanel.infoGrid.showSegment.end')}
      </Typography>
      <Typography variant='body2'>
        {showSegment !== undefined ? formatDurationMS(showSegment[1]) : ''}
      </Typography>
      <Typography variant='body2' color='textSecondary'>
        {t('collectiveRTHPanel.infoGrid.showSegment.duration')}
      </Typography>
      <Typography variant='body2'>
        {showSegment !== undefined
          ? formatDurationMS(showSegment[1] - showSegment[0])
          : ''}
      </Typography>
    </Box>
  );
};

export default InfoGrid;
