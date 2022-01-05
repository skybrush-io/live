import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import ButtonBase from '@material-ui/core/ButtonBase';
import { makeStyles } from '@material-ui/core/styles';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

const useStyles = makeStyles(
  (theme) => ({
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
  }),
  {
    name: 'UploadStatusLegendButton',
  }
);

const UploadStatusLegendButton = ({
  counter,
  label,
  onClick,
  status,
  tooltip,
  ...rest
}) => {
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

UploadStatusLegendButton.propTypes = {
  counter: PropTypes.number,
  label: PropTypes.string,
  status: PropTypes.string,
  tooltip: PropTypes.string,
  onClick: PropTypes.func,
};

export default UploadStatusLegendButton;
