import * as React from 'react';
import TextField from '@material-ui/core/TextField';

export const renderTextField = textField => (
  <TextField
    {...textField.input}
    style={textField.style}
    hintText={textField.hintText}
    floatingLabelText={textField.floatingLabelText}
    spellCheck="false"
    errorText={textField.meta.dirty && textField.meta.error}
    onKeyDown={textField.onKeyDown}
  />
  // Touched becomes true only after blur, but dirty is instantanious
  // errorText={textField.meta.touched && textField.meta.error}
);
