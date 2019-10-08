/**
 * @file The global snackbar at the bottom of the main window.
 */

import { amber, green } from '@material-ui/core/colors';
import IconButton from '@material-ui/core/IconButton';
import Snackbar from '@material-ui/core/Snackbar';
import SnackbarContent from '@material-ui/core/SnackbarContent';
import { makeStyles } from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CloseIcon from '@material-ui/icons/Close';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import WarningIcon from '@material-ui/icons/Warning';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { dismissSnackbar } from '~/actions/snackbar';
import { MessageSemantics } from '~/model/snackbar';

const semanticsToIcon = {
  [MessageSemantics.SUCCESS]: CheckCircleIcon,
  [MessageSemantics.WARNING]: WarningIcon,
  [MessageSemantics.ERROR]: ErrorIcon,
  [MessageSemantics.INFO]: InfoIcon
};

const useStyles = makeStyles(theme => ({
  success: {
    backgroundColor: green[600]
  },
  error: {
    backgroundColor: theme.palette.error.dark
  },
  info: {
    backgroundColor: theme.palette.primary.main
  },
  warning: {
    backgroundColor: amber[700]
  },
  icon: {
    fontSize: 20
  },
  iconVariant: {
    opacity: 0.9,
    marginRight: theme.spacing(1)
  },
  message: {
    display: 'flex',
    alignItems: 'center'
  }
}));

function SnackbarContentWrapper(props) {
  const classes = useStyles();
  const { className, message, onClose, semantics, ...other } = props;
  const Icon = semanticsToIcon[semantics];

  return (
    <SnackbarContent
      className={clsx(classes[semantics], className)}
      aria-describedby="client-snackbar"
      message={
        <span id="client-snackbar" className={classes.message}>
          <Icon className={clsx(classes.icon, classes.iconVariant)} />
          {message}
        </span>
      }
      action={[
        <IconButton
          key="close"
          aria-label="close"
          color="inherit"
          onClick={onClose}
        >
          <CloseIcon className={classes.icon} />
        </IconButton>
      ]}
      {...other}
    />
  );
}

SnackbarContentWrapper.propTypes = {
  className: PropTypes.string,
  message: PropTypes.string,
  onClose: PropTypes.func,
  semantics: PropTypes.oneOf(Object.values(MessageSemantics)).isRequired
};

/**
 * Presentation component for the global snackbar at the bottom of the main
 * window.
 *
 * @returns  {Object}  the rendered snackbar component
 */
const GlobalSnackbarPresentation = ({ onClose, open, message, semantics }) => {
  if (semantics && semantics !== MessageSemantics.DEFAULT) {
    return (
      <Snackbar open={open} autoHideDuration={3000} onClose={onClose}>
        <SnackbarContentWrapper
          semantics={semantics}
          message={message}
          onClose={onClose}
        />
      </Snackbar>
    );
  }

  return (
    <Snackbar
      open={open}
      message={message}
      autoHideDuration={3000}
      onClose={onClose}
    />
  );
};

GlobalSnackbarPresentation.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired
};

/**
 * Global snackbar at the bottom of the main window.
 */
const GlobalSnackbar = connect(
  // MapStateToProps
  state => state.snackbar,
  // MapDispatchToProps
  dispatch => ({
    onClose() {
      dispatch(dismissSnackbar());
    }
  })
)(GlobalSnackbarPresentation);

export default GlobalSnackbar;
