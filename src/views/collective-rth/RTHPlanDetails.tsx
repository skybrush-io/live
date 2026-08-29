/* eslint-disable @eslint-react/no-nested-component-definitions */
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import type { Theme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow, { type TableRowProps } from '@mui/material/TableRow';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { type TableProps, TableVirtuoso } from 'react-virtuoso';

import { makeStyles, monospacedFont } from '@skybrush/app-theme-mui';

import { COLLECTIVE_RTH_TIMING } from '~/features/show/constants';
import {
  type CollectiveRTHPlanSummaryItem,
  getShowStartTime,
} from '~/features/show/selectors';
import type { RootState } from '~/store/reducers';
import { formatDurationMS, formatTimeOfDay } from '~/utils/formatting';
import InfoGrid from './InfoGrid';

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
  showStartTime: number | null;
};

const RTHPlanDetails = ({ plans, showStartTime }: Props) => {
  const classes = useStyles();

  return (
    <Box className={classes.root}>
      <InfoGrid />
      <Box>
        <TableVirtuoso
          data={plans}
          components={{
            Scroller: ({ ref, ...props }) => (
              <TableContainer component={Paper} {...props} ref={ref} />
            ),
            Table: ({ style, ...props }: TableProps) => (
              <Table {...props} sx={{ ...style, width: '100%' }} />
            ),
            TableBody: ({ ref, ...props }) => (
              <TableBody {...props} ref={ref} />
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
  showStartTime: getShowStartTime(state),
}))(RTHPlanDetails);

export default ConnectedRTHPlanDetails;
