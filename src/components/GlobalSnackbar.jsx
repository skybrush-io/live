/**
 * @file The global snackbar at the bottom of the main window.
 */

import Snackbar from 'material-ui/Snackbar'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

/**
 * Presentation component for the global snackbar at the bottom of the main
 * window.
 */
const GlobalSnackbarPresentation = ({ open, message }) => (
  <Snackbar open={open} message={message} autoHideDuration={3000} />
)

GlobalSnackbarPresentation.propTypes = {
  message: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired
}

/**
 * Global snackbar at the bottom of the main window.
 */
const GlobalSnackbar = connect(
  // mapStateToProps
  state => state.snackbar
)(GlobalSnackbarPresentation)

export default GlobalSnackbar
