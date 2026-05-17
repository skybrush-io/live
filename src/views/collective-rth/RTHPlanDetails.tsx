import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import type { Theme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow, { type TableRowProps } from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { type TableProps, TableVirtuoso } from 'react-virtuoso';

import { makeStyles, monospacedFont } from '@skybrush/app-theme-mui';

import { COLLECTIVE_RTH_TIMING } from '~/features/show/constants';
import {
  type CollectiveRTHPlanSummaryItem,
  getShowStartTime,
} from '~/features/show/selectors';
import { getShowSegments } from '~/features/show/selectors/core';
import type { ShowSegmentsRecord } from '~/features/show/types';
import type { RootState } from '~/store/reducers';
import { formatDurationMS, formatTimeOfDay } from '~/utils/formatting';

type TableRowContentProps = {
  item: CollectiveRTHPlanSummaryItem;
  showStartTime: number | null;
};

const TableRowContent = ({ item, showStartTime }: TableRowContentProps) => {
  return (
    <>
      <TableCell>
        {formatTimeOfDay(item.time + (showStartTime ?? NaN))}
      </TableCell>
      <TableCell>{formatDurationMS(item.time)}</TableCell>
      <TableCell>
        {formatTimeOfDay(
          item.time +
            item.maxDuration +
            (showStartTime ?? NaN) +
            COLLECTIVE_RTH_TIMING.slowdownDuration -
            COLLECTIVE_RTH_TIMING.slowdownDurationInShowTime
        )}
      </TableCell>
      <TableCell>{formatDurationMS(item.time + item.maxDuration)}</TableCell>
      <TableCell>{formatDurationMS(item.maxDuration)}</TableCell>
    </>
  );
};

const useTableHeaderStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: theme.palette.background.default,
    height: '38px', // Same as HEADER_HEIGHT in views/uavs/constants.ts
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
    <TableRow className={classes.root}>
      <TableCell className={classes.cell} variant='head'>
        {t('collectiveRTHPanel.rthPlanDetails.column.start')}
      </TableCell>
      <TableCell className={classes.cell} variant='head'>
        {t('collectiveRTHPanel.rthPlanDetails.column.startShow')}
      </TableCell>
      <TableCell className={classes.cell} variant='head'>
        {t('collectiveRTHPanel.rthPlanDetails.column.end')}
      </TableCell>
      <TableCell className={classes.cell} variant='head'>
        {t('collectiveRTHPanel.rthPlanDetails.column.endShow')}
      </TableCell>
      <TableCell className={classes.cell} variant='head'>
        {t('collectiveRTHPanel.rthPlanDetails.column.duration')}
      </TableCell>
    </TableRow>
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
  tableRow: {
    '& .MuiTableCell-root': {
      padding: theme.spacing(0.5),
    },
  },
}));

type Props = {
  plans: CollectiveRTHPlanSummaryItem[];
  showSegments: ShowSegmentsRecord | undefined;
  showStartTime: number | null;
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
            // eslint-disable-next-line react/display-name
            Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
              <TableContainer component={Paper} {...props} ref={ref} />
            )),
            Table: ({ style, ...props }: TableProps) => (
              <Table {...props} sx={{ ...style, width: '100%' }} />
            ),
            // eslint-disable-next-line react/display-name
            TableBody: React.forwardRef<HTMLTableSectionElement>(
              (props, ref) => <TableBody {...props} ref={ref} />
            ),
            TableRow: ({
              item,
              ...rest
            }: TableRowProps & { item: CollectiveRTHPlanSummaryItem }) => (
              <TableRow className={classes.tableRow} {...rest}>
                <TableRowContent item={item} showStartTime={showStartTime} />
              </TableRow>
            ),
          }}
          fixedHeaderContent={TableHeader}
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
