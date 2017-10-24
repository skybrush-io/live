/**
 * @file The global error dialog that appears on top of the main window when
 * there is an unexpected error.
 */

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { closeErrorDialog } from '../actions/error-handling'

/**
 * Presentation component for the global error dialog.
 *
 * @returns  {Object}  the rendered component
 */
const GlobalErrorDialogPresentation = ({ open, message, onClose }) => {
  const actions = [
    <FlatButton label={'Close'} onTouchTap={onClose} />
  ]
  const contentStyle = {
    width: '640px'
  }

  return (
    <Dialog open={open} title={'An error happened'} modal
      contentStyle={contentStyle} actions={actions}>
      {message}
    </Dialog>
  )
}

GlobalErrorDialogPresentation.propTypes = {
  message: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func
}

/**
 * Global error dialog.
 */
const GlobalErrorDialog = connect(
  // mapStateToProps
  state => state.dialogs.error,
  // mapDispatchToProps
  dispatch => ({
    onClose () {
      dispatch(closeErrorDialog())
    }
  })
)(GlobalErrorDialogPresentation)

export default GlobalErrorDialog
