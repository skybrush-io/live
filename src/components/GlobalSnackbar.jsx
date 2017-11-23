/**
 * @file The global snackbar at the bottom of the main window.
 */

import Snackbar from 'material-ui/Snackbar'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { dismissSnackbar } from '../actions/snackbar'

/**
 * Presentation component for the global snackbar at the bottom of the main
 * window.
 *
 * @returns  {Object}  the rendered snackbar component
 */
const GlobalSnackbarPresentation = ({ onRequestClose, open, message }) => (
  <Snackbar open={open} message={message} autoHideDuration={3000}
    onRequestClose={onRequestClose} />
)

GlobalSnackbarPresentation.propTypes = {
  message: PropTypes.string.isRequired,
  onRequestClose: PropTypes.func,
  open: PropTypes.bool.isRequired
}

/**
 * Global snackbar at the bottom of the main window.
 */
const GlobalSnackbar = connect(
  // mapStateToProps
  state => state.snackbar,
  // mapDispatchToProps
  dispatch => ({
    onRequestClose () {
      dispatch(dismissSnackbar())
    }
  })
)(GlobalSnackbarPresentation)

export default GlobalSnackbar
