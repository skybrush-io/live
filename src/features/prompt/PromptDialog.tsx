/**
 * @file Generic single-line input dialog to act as a replacement
 * for `window.prompt()`.
 */

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import { TextField } from 'mui-rff';
import { Form } from 'react-final-form';
import React from 'react';
import { connect } from 'react-redux';

import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';

import { cancelPromptDialog, submitPromptDialog } from './actions';
import type { PromptSliceState } from './slice';
import { PromptDialogType, type PromptOptions } from './types';

type FormValues = {
  value: string;
};

type PromptDialogFormProps = Pick<
  PromptOptions,
  'cancelButtonLabel' | 'hintText' | 'message' | 'submitButtonLabel' | 'type'
> & {
  initialValues: FormValues;
  onCancel: () => void;
  onSubmit: (value: string | boolean) => void;
  optimizeUIForTouch?: boolean;
};

const PromptDialogForm: React.FunctionComponent<PromptDialogFormProps> = ({
  cancelButtonLabel,
  hintText,
  initialValues,
  message,
  onCancel,
  onSubmit,
  optimizeUIForTouch,
  submitButtonLabel,
  type,
}: PromptDialogFormProps) => {
  const hasTextField = type === PromptDialogType.PROMPT;
  const handleSubmit = (data: FormValues): void => {
    if (hasTextField) {
      onSubmit(data.value);
    } else {
      onSubmit(true);
    }
  };

  return (
    /* eslint-disable @typescript-eslint/explicit-function-return-type */
    <Form initialValues={initialValues} onSubmit={handleSubmit}>
      {({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <DialogContentText>{message}</DialogContentText>
            {hasTextField && (
              <TextField
                fullWidth
                autoFocus={!optimizeUIForTouch}
                name='value'
                margin='dense'
                label={hintText}
                variant='filled'
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button color='primary' type='submit'>
              {submitButtonLabel}
            </Button>
            <Button onClick={onCancel}>{cancelButtonLabel}</Button>
          </DialogActions>
        </form>
      )}
    </Form>
    /* eslint-enable @typescript-eslint/explicit-function-return-type */
  );
};

type PromptDialogPresentationProps = Omit<
  PromptDialogFormProps,
  'initialValues'
> & {
  dialogVisible: boolean;
  initialValue: string;
  title: string;
};

const PromptDialogPresentation: React.FunctionComponent<
  PromptDialogPresentationProps
> = ({
  initialValue,
  onCancel,
  title,
  dialogVisible,
  ...rest
}: PromptDialogPresentationProps) => (
  <Dialog
    open={dialogVisible}
    aria-labelledby={title ? 'prompt-dialog-title' : undefined}
    onClose={onCancel}
  >
    {title ? <DialogTitle id='prompt-dialog-title'>{title}</DialogTitle> : null}
    {dialogVisible && (
      <PromptDialogForm
        {...rest}
        initialValues={{ value: initialValue }}
        onCancel={onCancel}
      />
    )}
  </Dialog>
);

// TODO: remove 'any' types from here once the store is properly annotated

const PromptDialog = connect<PromptDialogPresentationProps>(
  // mapStateToProps
  (state: any): any => ({
    ...(state.dialogs.prompt as PromptSliceState),
    optimizeUIForTouch: Boolean(shouldOptimizeUIForTouch(state)),
  }),

  // mapDispatchToProps
  (dispatch) => ({
    onCancel(): void {
      dispatch(cancelPromptDialog() as any);
    },

    onSubmit(value: string | boolean): void {
      dispatch(submitPromptDialog(value) as any);
    },
  })
)(PromptDialogPresentation);

export default PromptDialog;
