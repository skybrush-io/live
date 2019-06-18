/**
 * @file Generic single-line input dialog to act as a replacement
 * for `window.prompt()`.
 */

import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'

import PropTypes from 'prop-types'
import { reduxForm, Field } from 'redux-form'
import { TextField } from 'redux-form-material-ui'
import React from 'react'
import { connect } from 'react-redux'

import { cancelPromptDialog, submitPromptDialog } from '../../actions/prompt'

const PromptDialogFormPresentation = ({
  cancelButtonLabel, handleSubmit, hintText, message, onCancelled,
  submitButtonLabel
}) => (
  <form onSubmit={handleSubmit}>
    <DialogContent>
      <DialogContentText>
        {message}
      </DialogContentText>
      <Field component={TextField} autoFocus
        name='value' margin='dense' id='value'
        label={hintText} fullWidth />
    </DialogContent>
    <DialogActions>
      <Button color="primary" type="submit">{submitButtonLabel}</Button>
      <Button onClick={onCancelled}>{cancelButtonLabel}</Button>
    </DialogActions>
  </form>
)

PromptDialogFormPresentation.propTypes = {
  cancelButtonLabel: PropTypes.string,
  hintText: PropTypes.string,
  message: PropTypes.string,
  submitButtonLabel: PropTypes.string,

  handleSubmit: PropTypes.func,
  onCancelled: PropTypes.func
}

const PromptDialogForm = reduxForm({
  form: 'prompt',
  initialValues: {
    value: ''
  }
})(PromptDialogFormPresentation)

const PromptDialogPresentation = props => {
  const { initialValue, onCancelled, title, dialogVisible } = props

  /* Some trickery is needed below to ensure that the form is unmounted
   * when the dialog is closed, allowing redux-form to reinitialize it */
  return (
    <Dialog open={dialogVisible} onClose={onCancelled}
      aria-labelledby={title ? 'prompt-dialog-title' : undefined}>
      {title ? <DialogTitle id="prompt-dialog-title">{title}</DialogTitle> : null}
      {dialogVisible && <PromptDialogForm {...props} initialValues={{ value: initialValue }} />}
    </Dialog>
  )
}

PromptDialogPresentation.propTypes = {
  ...PromptDialogFormPresentation.propTypes,
  dialogVisible: PropTypes.bool,
  initialValue: PropTypes.string,
  title: PropTypes.string
}

const PromptDialog = connect(
  // mapStateToProps
  state => state.dialogs.prompt,
  // mapDispatchToProps
  dispatch => ({
    onCancelled () {
      dispatch(cancelPromptDialog())
    },

    onSubmit (data) {
      dispatch(submitPromptDialog(data.value))
    }
  })
)(PromptDialogPresentation)

export default PromptDialog
