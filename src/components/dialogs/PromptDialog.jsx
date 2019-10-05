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
import { Form, Field } from 'react-final-form'
import React from 'react'
import { connect } from 'react-redux'

import { cancelPromptDialog, submitPromptDialog } from '../../actions/prompt'
import { TextField } from '../forms'

const PromptDialogForm = ({
  cancelButtonLabel, hintText, initialValues, message, onCancel, onSubmit,
  submitButtonLabel
}) => (
  <Form initialValues={initialValues} onSubmit={onSubmit}>
    {({ handleSubmit }) => (
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
          <Button onClick={onCancel}>{cancelButtonLabel}</Button>
        </DialogActions>
      </form>
    )}
  </Form>
)

PromptDialogForm.propTypes = {
  cancelButtonLabel: PropTypes.string,
  hintText: PropTypes.string,
  message: PropTypes.string,
  submitButtonLabel: PropTypes.string,

  onCancel: PropTypes.func,
  onSubmit: PropTypes.func
}

const PromptDialogPresentation = props => {
  const { initialValue, onCancel, title, dialogVisible } = props
  return (
    <Dialog open={dialogVisible} onClose={onCancel}
      aria-labelledby={title ? 'prompt-dialog-title' : undefined}>
      {title ? <DialogTitle id="prompt-dialog-title">{title}</DialogTitle> : null}
      {dialogVisible && <PromptDialogForm {...props} initialValues={{ value: initialValue }} />}
    </Dialog>
  )
}

PromptDialogPresentation.propTypes = {
  ...PromptDialogForm.propTypes,
  dialogVisible: PropTypes.bool,
  initialValue: PropTypes.string,
  title: PropTypes.string
}

const PromptDialog = connect(
  // mapStateToProps
  state => state.dialogs.prompt,
  // mapDispatchToProps
  dispatch => ({
    onCancel () {
      dispatch(cancelPromptDialog())
    },

    onSubmit (data) {
      dispatch(submitPromptDialog(data.value))
    }
  })
)(PromptDialogPresentation)

export default PromptDialog
