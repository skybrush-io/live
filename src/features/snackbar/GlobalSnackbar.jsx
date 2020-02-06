/**
 * @file The global snackbar at the bottom of the main window.
 */

import { amber, green, lightBlue } from '@material-ui/core/colors';
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

import { dismissSnackbar } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';

const semanticsToIcon = {
  [MessageSemantics.SUCCESS]: CheckCircleIcon,
  [MessageSemantics.WARNING]: WarningIcon,
  [MessageSemantics.ERROR]: ErrorIcon,
  [MessageSemantics.INFO]: InfoIcon
};

const useStyles = makeStyles(
  theme => ({
    success: {
      backgroundColor: green[600],
      color: 'white'
    },
    error: {
      backgroundColor: theme.palette.error.dark,
      color: 'white'
    },
    info: {
      backgroundColor: lightBlue[500],
      color: 'white'
    },
    warning: {
      backgroundColor: amber[700],
      color: 'white'
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
  }),
  { name: 'GlobalSnackbar' }
);

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
          {Icon && <Icon className={clsx(classes.icon, classes.iconVariant)} />}
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
const GlobalSnackbar = ({
  dismissSnackbar,
  open,
  message,
  permanent,
  semantics
}) => (
  <Snackbar
    open={open}
    autoHideDuration={permanent ? null : 3000}
    onClose={() => dismissSnackbar()}
  >
    <SnackbarContentWrapper
      semantics={semantics || MessageSemantics.DEFAULT}
      message={message}
      onClose={() => dismissSnackbar()}
    />
  </Snackbar>
);

GlobalSnackbar.propTypes = {
  dismissSnackbar: PropTypes.func,
  message: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  permanent: PropTypes.bool,
  semantics: PropTypes.oneOf(Object.values(MessageSemantics)).isRequired
};

/**
 * Global snackbar at the bottom of the main window.
 */
export default connect(
  // mapStateToProps
  state => state.snackbar,
  // mapDispatchToProps
  { dismissSnackbar }
)(GlobalSnackbar);
