import clsx from 'clsx';

import { makeStyles } from '@skybrush/app-theme-mui';
import { StatusLight } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';

const useStyles = makeStyles({
  counter: {
    padding: '0 4px',
    userSelect: 'none',
    fontVariantNumeric: 'tabular-nums',
  },

  off: {
    opacity: 0.5,
  },

  statusLight: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
  },
});

type UAVStatusSummaryLightProps = {
  count: number;
  statusCode: Status;
};

const UAVStatusSummaryLight = ({
  count,
  statusCode,
}: UAVStatusSummaryLightProps) => {
  const classes = useStyles();

  return (
    <div className={classes.statusLight}>
      <StatusLight inline status={count > 0 ? statusCode : Status.OFF} />
      <div className={clsx(classes.counter, count <= 0 && classes.off)}>
        {count}
      </div>
    </div>
  );
};

export default UAVStatusSummaryLight;