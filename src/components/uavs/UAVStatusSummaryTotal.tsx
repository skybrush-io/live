import Sum from '@mui/icons-material/Functions';
import Button from '@mui/material/Button';
import clsx from 'clsx';

import { makeStyles } from '@skybrush/app-theme-mui';

const useStyles = makeStyles((theme) => ({
  button: {
    color: 'white',
    display: 'flex',
    flexDirection: 'row',
    fontWeight: 'normal',
    paddingLeft: 0,
    paddingRight: 0,
    minWidth: 48,
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.65)' /* copied from .wb-module */,

    '&:hover': {
      boxShadow: theme.shadows[2],
    },
  },

  counter: {
    padding: '0 4px',
    userSelect: 'none',
    fontVariantNumeric: 'tabular-nums',
  },

  off: {
    opacity: 0.5,
  },
}));

type UAVStatusSummaryTotalProps = {
  count: number;
  onSelectAll: () => void;
};

const UAVStatusSummaryTotal = ({
  count,
  onSelectAll,
}: UAVStatusSummaryTotalProps) => {
  const classes = useStyles();

  return (
    <Button className={classes.button} onClick={onSelectAll}>
      <Sum />
      <div className={clsx(classes.counter, count <= 0 && classes.off)}>
        {count}
      </div>
    </Button>
  );
};

export default UAVStatusSummaryTotal;