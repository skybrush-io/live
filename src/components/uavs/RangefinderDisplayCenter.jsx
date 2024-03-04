import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import { SectorStatus } from './RangefinderDisplaySector';

const makeRing = (name, size, color) => ({
  [name]: {
    width: `${size}%`,
    height: `${size}%`,

    [`.${name} &`]: {
      borderColor: color,
    },
  },
});

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100%',
    position: 'absolute',

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ring: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translateX(-50%) translateY(-50%)',

    border: `solid 0.75em ${theme.palette.action.selected}`,
    borderRadius: '50%',
  },

  ...makeRing(SectorStatus.NEAR, 45, theme.palette.error.main),
  ...makeRing(SectorStatus.MID, 65, theme.palette.warning.main),
  ...makeRing(SectorStatus.FAR, 85, theme.palette.success.main),
}));

const RangefinderDisplayCenter = ({ distance, status }) => {
  const classes = useStyles();
  return (
    <div className={clsx(classes.root, status)}>
      <div className={clsx(classes.ring, classes.near)} />
      <div className={clsx(classes.ring, classes.mid)} />
      <div className={clsx(classes.ring, classes.far)} />
      <div>{distance}</div>
    </div>
  );
};

RangefinderDisplayCenter.propTypes = {
  distance: PropTypes.string,
  status: PropTypes.oneOf(Object.values(SectorStatus)),
};

export default RangefinderDisplayCenter;
