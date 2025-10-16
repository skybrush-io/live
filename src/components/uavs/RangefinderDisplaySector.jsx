import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@skybrush/app-theme-mui';

export const SectorStatus = {
  NEAR: 'near',
  MID: 'mid',
  FAR: 'far',
  OFF: 'off',
};

// Partial arc CSS idea credit:
// https://stackoverflow.com/a/13059412/1831096

const makeSegment = (name, offset, color) => ({
  [name]: {
    top: `-${offset}em`,
    left: `-${offset}em`,

    [`.${name} &:before`]: {
      borderColor: color,
    },
  },
});

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },

  arc: {
    position: 'absolute',
    right: '50%',
    bottom: '50%',

    transformOrigin: '100% 100%',
    transform: ({ angle }) => `rotate(${angle / 2}deg) skewY(${90 - angle}deg)`,

    overflow: 'hidden',

    '&:before': {
      content: '""',
      display: 'block',

      width: '200%',
      height: '200%',

      border: `solid 1.5em ${theme.palette.action.selected}`,
      borderRadius: '50%',

      transform: ({ angle }) => `skewY(-${90 - angle}deg)`,
    },
  },

  ...makeSegment(SectorStatus.NEAR, 2, theme.palette.error.main),
  ...makeSegment(SectorStatus.MID, 4, theme.palette.warning.main),
  ...makeSegment(SectorStatus.FAR, 6, theme.palette.success.main),

  text: {
    height: '100%',
    textAlign: 'center',
    transform: 'translateY(-8em)',
  },
}));

const RangefinderDisplaySector = ({ angle, distance, rotation, status }) => {
  const classes = useStyles({ angle });
  return (
    <div
      className={clsx(classes.root, status)}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div className={clsx(classes.arc, classes.near)} />
      <div className={clsx(classes.arc, classes.mid)} />
      <div className={clsx(classes.arc, classes.far)} />
      <div className={classes.text}>{distance}</div>
    </div>
  );
};

RangefinderDisplaySector.propTypes = {
  angle: PropTypes.number,
  distance: PropTypes.string,
  rotation: PropTypes.number,
  status: PropTypes.oneOf(Object.values(SectorStatus)),
};

export default RangefinderDisplaySector;
