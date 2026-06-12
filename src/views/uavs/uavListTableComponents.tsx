import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { Theme } from '@mui/material/styles';
import React from 'react';
import type { TableComponents } from 'react-virtuoso';

import { isThemeDark, makeStyles } from '@skybrush/app-theme-mui';

import { LIST_MIN_WIDTH } from './listColumnLayout';
import type { Item } from './types';

const useScrollerStyles = makeStyles((theme: Theme) => ({
  scroller: {
    background: isThemeDark(theme)
      ? 'linear-gradient(180deg, #0e1218 0%, #12151a 100%)'
      : theme.palette.background.default,
    height: '100%',
    minWidth: LIST_MIN_WIDTH,
    overflow: 'auto',
  },

  paper: {
    background: 'transparent',
    boxShadow: 'none',
    height: '100%',
  },

  table: {
    borderCollapse: 'separate',
    borderSpacing: 0,
    minWidth: LIST_MIN_WIDTH,
    tableLayout: 'fixed',
    width: '100%',
  },

  head: {
    background: 'transparent',
  },

  bodyRow: {
  },

  bodyCell: {
    borderBottom: isThemeDark(theme)
      ? '1px solid rgba(255, 255, 255, 0.06)'
      : `1px solid ${theme.palette.divider}`,
    padding: 0,
    verticalAlign: 'middle',
  },
}));

type ScrollerProps = React.ComponentProps<'div'>;

const VirtuosoScroller = React.forwardRef<HTMLDivElement, ScrollerProps>(
  function VirtuosoScroller(props, ref) {
    const classes = useScrollerStyles();
    return (
      <TableContainer
        component={Paper}
        className={classes.paper}
        {...props}
        ref={ref}
        sx={{ height: '100%', overflow: 'auto' }}
      />
    );
  }
);

const VirtuosoTable = (props: React.ComponentProps<typeof Table>): React.JSX.Element => {
  const classes = useScrollerStyles();
  return <Table {...props} className={classes.table} size='small' stickyHeader />;
};

const VirtuosoTableHead = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<typeof TableHead>
>(function VirtuosoTableHead(props, ref) {
  const classes = useScrollerStyles();
  return <TableHead {...props} ref={ref} className={classes.head} />;
});

const VirtuosoTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<typeof TableBody>
>(function VirtuosoTableBody(props, ref) {
  return <TableBody {...props} ref={ref} />;
});

const VirtuosoTableRow = (props: React.ComponentProps<typeof TableRow>): React.JSX.Element => {
  const classes = useScrollerStyles();
  return <TableRow hover {...props} className={classes.bodyRow} />;
};

export const createUAVListTableComponents = (): TableComponents<Item> => ({
  Scroller: VirtuosoScroller,
  Table: VirtuosoTable,
  TableHead: VirtuosoTableHead,
  TableBody: VirtuosoTableBody,
  TableRow: VirtuosoTableRow,
});

export const UAVListTableCell = ({
  children,
}: React.PropsWithChildren): React.JSX.Element => {
  const classes = useScrollerStyles();
  return (
    <TableCell component='td' className={classes.bodyCell} padding='none'>
      {children}
    </TableCell>
  );
};

export const UAVListTableHeaderCell = ({
  children,
}: React.PropsWithChildren): React.JSX.Element => (
  <TableCell component='th' padding='none' sx={{ border: 0, verticalAlign: 'bottom' }}>
    {children}
  </TableCell>
);
