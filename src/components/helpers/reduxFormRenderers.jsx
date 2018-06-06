import TextField from '@material-ui/core/TextField'

/**
 * Renders a text field from it's parameters.
 */
export const renderTextField = textField => (
  <TextField {...textField.input}
    style={textField.style}
    hintText={textField.hintText}
    floatingLabelText={textField.floatingLabelText}
    spellCheck='false'
    errorText={textField.meta.dirty && textField.meta.error}
    onKeyDown={textField.onKeyDown} />
    // touched becomes true only after blur, but dirty is instantanious
    // errorText={textField.meta.touched && textField.meta.error}
)
