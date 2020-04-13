import config from "config";

import PropTypes from "prop-types";
import React from "react";
import ReactTour from "reactour";
import { connect } from "react-redux";

import { makeStyles } from "@material-ui/core/styles";

import { closeSidebar, openSidebar } from "~/features/sidebar/slice";
import { dismissTour } from "~/features/tour/slice";

const useStyles = makeStyles(
  (theme) => ({
    root: {
      color: "#222",
    },
    button: {
      backgroundColor: "#007aff",
      color: "white",
      padding: theme.spacing(1),
      borderRadius: theme.spacing(0.5),
      fontSize: theme.typography.fontSize,
    },
  }),
  {
    name: "Tour",
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
      className={classes.root}
      closeWithMask={false}
      disableInteraction
      lastStepNextButton={<div className={classes.button}>Get started!</div>}
      maskSpace={20}
      steps={steps}
      isOpen={config.tour ? isOpen : false}
      onRequestClose={onClose}
      rounded={4}
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
    const steps = config.tour ? config.tour.steps : [];
    return {
      onClose() {
        dispatch(dismissTour());
      },

      steps,
    };
  }
)(Tour);
