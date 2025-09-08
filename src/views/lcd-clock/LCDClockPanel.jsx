import Box from '@mui/material/Box';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { addClockDisplayAutomatically } from '~/features/lcd-clock/actions';
import { removeClockDisplay } from '~/features/lcd-clock/slice';

import LCDClockDisplay from './LCDClockDisplay';

const useStyles = makeStyles(
  () => ({
    root: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
    },
  }),
  { name: 'LCDClockPanel' }
);

/**
 * Panel that shows the status of a clock in the style of a classic
 * 7-segment LCD display.
 */
const LCDClockPanel = ({ addClockDisplay, ids, removeClockDisplay }) => {
  const classes = useStyles();

  return (
    <Box className={clsx(classes.root)}>
      {(ids || []).map((id, index) => (
        <LCDClockDisplay
          key={id}
          id={id}
          flex={1}
          onAdd={index === 0 ? addClockDisplay : null}
          onRemove={index === 0 ? null : () => removeClockDisplay(id)}
        />
      ))}
    </Box>
  );
};

LCDClockPanel.propTypes = {
  ids: PropTypes.arrayOf(PropTypes.string),
  addClockDisplay: PropTypes.func,
  removeClockDisplay: PropTypes.func,
};

LCDClockPanel.defaultProps = {};

export default connect(
  // mapStateToProps
  (state) => ({
    ids: state.lcdClock.order,
  }),
  // mapDispatchToProps
  { addClockDisplay: addClockDisplayAutomatically, removeClockDisplay }
)(LCDClockPanel);
