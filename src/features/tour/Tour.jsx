import config from 'config';

import PropTypes from 'prop-types';
import React from 'react';
import ReactTour from 'reactour';
import { connect } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';

import { dismissTour } from '~/features/tour/slice';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      color: ['#222', '!important'],
    },
    button: {
      backgroundColor: '#007aff',
      color: 'white',
      padding: theme.spacing(1),
      borderRadius: theme.spacing(0.5),
      fontSize: theme.typography.fontSize,
    },
  }),
  {
    name: 'Tour',
  }
);

/**
 * Tour component that provides a quick walkthrough of the UI for the
 * first-time user.
 */
const Tour = ({ onClose, isOpen, steps }) => {
  const classes = useStyles();
  return (
    <ReactTour
      disableInteraction
      className={classes.root}
      closeWithMask={false}
      lastStepNextButton={<div className={classes.button}>Get started!</div>}
      maskSpace={20}
      steps={steps}
      isOpen={config.tour ? isOpen : false}
      rounded={4}
      onRequestClose={onClose}
    />
  );
};

Tour.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  steps: PropTypes.arrayOf(PropTypes.object),
};

export default connect(
  // mapStateToProps
  (state) => state.tour,
  // mapDispatchToProps
  (dispatch) => {
    const steps = config?.tour?.steps || [];
    return {
      onClose() {
        dispatch(dismissTour());
      },

      steps,
    };
  }
)(Tour);
