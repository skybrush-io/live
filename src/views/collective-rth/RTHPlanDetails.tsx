import Box from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { type TableProps, TableVirtuoso } from 'react-virtuoso';

import { makeStyles, monospacedFont } from '@skybrush/app-theme-mui';

import { COLLECTIVE_RTH_TIMING } from '~/features/show/constants';
import { getShowStartTime } from '~/features/show/selectors';
import { getShowSegments } from '~/features/show/selectors/core';
import { type CollectiveRTHPlanSummaryItem } from '~/features/show/selectors/rth';
import type { ShowSegmentsRecord } from '~/features/show/types';
import type { RootState } from '~/store/reducers';
import { formatDurationMS, formatTimeOfDay } from '~/utils/formatting';

const useTableRowStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  cell: {
    padding: theme.spacing(0.5, 1),
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

type TableRowProps = {
  item: CollectiveRTHPlanSummaryItem;
  showStartTime: number | null;
};

const TableRow = ({ item, showStartTime }: TableRowProps) => {
  const classes = useTableRowStyles();
  return (
    <Box className={classes.root}>
      <Box className={classes.cell}>
        {formatTimeOfDay(item.time + (showStartTime ?? NaN))}
      </Box>
      <Box className={classes.cell}>{formatDurationMS(item.time)}</Box>
      <Box className={classes.cell}>
        {formatTimeOfDay(
          item.time +
            item.maxDuration +
            (showStartTime ?? NaN) +
            COLLECTIVE_RTH_TIMING.slowdownDuration -
            COLLECTIVE_RTH_TIMING.slowdownDurationInShowTime
        )}
      </Box>
      <Box className={classes.cell}>
        {formatDurationMS(item.time + item.maxDuration)}
      </Box>
      <Box className={classes.cell}>{formatDurationMS(item.maxDuration)}</Box>
    </Box>
  );
};

const useTableHeaderStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.default,
    position: 'sticky',
    top: 0,
  },
  cell: {
    padding: theme.spacing(0.5, 1),
    flex: 1,
    fontFamily: monospacedFont,
    fontSize: 'small',
    minWidth: 0,
    overflow: 'hidden',
    textAlign: 'start',
    textOverflow: 'ellipsis',
    userSelect: 'none',
    whiteSpace: 'pre',
  },
}));

const TableHeader = () => {
  const { t } = useTranslation();
  const classes = useTableHeaderStyles();

  return (
    <tr className={classes.root}>
      <Typography className={classes.cell} component='th'>
        {t('collectiveRTHPanel.rthPlanDetails.column.start')}
      </Typography>
      <Typography className={classes.cell} component='th'>
        {t('collectiveRTHPanel.rthPlanDetails.column.startShow')}
      </Typography>
      <Typography className={classes.cell} component='th'>
        {t('collectiveRTHPanel.rthPlanDetails.column.end')}
      </Typography>
      <Typography className={classes.cell} component='th'>
        {t('collectiveRTHPanel.rthPlanDetails.column.endShow')}
      </Typography>
      <Typography className={classes.cell} component='th'>
        {t('collectiveRTHPanel.rthPlanDetails.column.duration')}
      </Typography>
    </tr>
  );
};

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

type InfoGridProps = {
  plans: CollectiveRTHPlanSummaryItem[];
  showSegment: [number, number] | undefined;
};

const InfoGrid = ({ plans, showSegment }: InfoGridProps) => {
  const { t } = useTranslation();
  const classes = useInfoGridStyles();

  return (
    <Box className={classes.root}>
      <Typography className={classes.sectionHeader} variant='body2'>
        {t('collectiveRTHPanel.rthPlanDetails.info.showSegment.title')}
      </Typography>
      <Typography variant='body2' color='textSecondary'>
        {t('collectiveRTHPanel.rthPlanDetails.info.showSegment.start')}
      </Typography>
      <Typography variant='body2'>
        {showSegment !== undefined ? formatDurationMS(showSegment[0]) : ''}
      </Typography>
      <Typography variant='body2' color='textSecondary'>
        {t('collectiveRTHPanel.rthPlanDetails.info.showSegment.end')}
      </Typography>
      <Typography variant='body2'>
        {showSegment !== undefined ? formatDurationMS(showSegment[1]) : ''}
      </Typography>
      <Typography variant='body2' color='textSecondary'>
        {t('collectiveRTHPanel.rthPlanDetails.info.showSegment.duration')}
      </Typography>
      <Typography variant='body2'>
        {showSegment !== undefined
          ? formatDurationMS(showSegment[1] - showSegment[0])
          : ''}
      </Typography>
      <Typography className={classes.sectionHeader} variant='body2'>
        {t('collectiveRTHPanel.rthPlanDetails.info.rth.title')}
      </Typography>
      <Typography variant='body2' color='textSecondary'>
        {t('collectiveRTHPanel.rthPlanDetails.info.rth.numPlans')}
      </Typography>
      <Typography variant='body2'>{plans.length}</Typography>
    </Box>
  );
};

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'grid',
    gridTemplateRows: 'max-content 1fr',
    gap: theme.spacing(1),
    height: '100%',
  },
}));

type Props = {
  plans: CollectiveRTHPlanSummaryItem[];
  firstTime: number | undefined;
  lastTime: number | undefined;
  showStartTime: number | null;
  showSegments: ShowSegmentsRecord | undefined;
};

const RTHPlanDetails = ({ plans, showSegments, showStartTime }: Props) => {
  const classes = useStyles();
  const showSegment = showSegments?.show;

  return (
    <Box className={classes.root}>
      <InfoGrid plans={plans} showSegment={showSegment} />
      <Box>
        <TableVirtuoso
          data={plans}
          components={{
            Table: ({ style, ...props }: TableProps) => (
              <table {...props} style={{ ...style, width: '100%' }} />
            ),
          }}
          fixedHeaderContent={TableHeader}
          itemContent={(_, item) => (
            <TableRow item={item} showStartTime={showStartTime} />
          )}
        />
      </Box>
    </Box>
  );
};

const ConnectedRTHPlanDetails = connect((state: RootState) => ({
  showSegments: getShowSegments(state),
  showStartTime: getShowStartTime(state),
}))(RTHPlanDetails);

export default ConnectedRTHPlanDetails;
