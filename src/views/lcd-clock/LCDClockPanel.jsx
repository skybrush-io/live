import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import LCDClockDisplay from './LCDClockDisplay';

import { addClockDisplayAutomatically } from '~/features/lcd-clock/actions';
import { removeClockDisplay } from '~/features/lcd-clock/slice';

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
