/* eslint-disable @typescript-eslint/naming-convention */
import ButtonBase, { type ButtonBaseProps } from '@mui/material/ButtonBase';
import type { Theme } from '@mui/material/styles';
import clsx from 'clsx';
import React from 'react';

import { type Status, makeStyles } from '@skybrush/app-theme-mui';
import StatusLight from '@skybrush/mui-components/lib/StatusLight';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import type { Nullable } from '~/utils/types';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1),

    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSize,

    '& span.counter': {
      margin: theme.spacing(0, 0.5, 0, 1),
    },

    '& span.label': {
      opacity: 0.5,
    },
  },

  selectable: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      borderRadius: theme.spacing(0.5),
    },
  },
}));

type UploadStatusLegendButtonProps = Readonly<{
  counter: number;
  label: string;
  status: Status;
  tooltip?: Nullable<string>;
  onClick?: () => void;
}> &
  ButtonBaseProps;

const UploadStatusLegendButton = ({
  counter,
  label,
  onClick,
  status,
  tooltip,
  ...rest
}: UploadStatusLegendButtonProps): JSX.Element => {
  const classes = useStyles();
  const enabled = onClick && counter > 0;
  const button = (
    <ButtonBase
      className={clsx(classes.root, enabled && classes.selectable)}
      disabled={!enabled}
      onClick={onClick}
      {...rest}
    >
      <StatusLight inline status={status} />
      <span className='counter'>{counter}</span>
      <span className='label'>{label}</span>
    </ButtonBase>
  );

  return tooltip ? <Tooltip content={tooltip}>{button}</Tooltip> : button;
};

export default UploadStatusLegendButton;
