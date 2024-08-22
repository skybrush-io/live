/**
 * @file Generic input dialog to request data from the user based on a schema.
 */

import * as React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import Form from '@rjsf/material-ui';
import validator from '@rjsf/validator-ajv8';

import { cancelPromptDialog, submitPromptDialog } from './actions';
import type { PromptSliceState } from './slice';
import { PromptDialogType, type PromptOptions } from './types';

type FormValues = {
  value: string;
};

type PromptDialogFormProps = Pick<
  PromptOptions,
  'cancelButtonLabel' | 'message' | 'submitButtonLabel'
> & {
  initialValues: FormValues;
  onCancel: () => void;
  onSubmit: (event: { formData?: Record<string, any> }) => void;
  optimizeUIForTouch?: boolean;
  schema: Record<string, any>;
  type: PromptDialogType;
};

const PromptDialogForm: React.FunctionComponent<PromptDialogFormProps> = ({
  cancelButtonLabel,
  initialValues,
  message,
  onCancel,
  onSubmit,
  schema,
  submitButtonLabel,
  type,
}) => (
  <DialogContent>
    {message && (
      <Box py={1}>
        <DialogContentText>{message}</DialogContentText>
      </Box>
    )}
    {type === PromptDialogType.GENERIC && (
      <Form
        // TODO: Somehow make `fields.SchemaField` use `DialogContent`.
        formData={initialValues}
        schema={schema}
        validator={validator}
        onSubmit={onSubmit}
      >
        <DialogActions style={{ padding: 0 }}>
          <Button color='primary' type='submit'>
            {submitButtonLabel ?? 'Submit'}
          </Button>
          <Button onClick={onCancel}>{cancelButtonLabel ?? 'Cancel'}</Button>
        </DialogActions>
      </Form>
    )}
    {type === PromptDialogType.CONFIRMATION && (
      <DialogActions style={{ padding: 0 }}>
        <Button
          color='primary'
          onClick={(): void => {
            onSubmit({ formData: { confirmed: true } });
          }}
        >
          {submitButtonLabel ?? 'Confirm'}
        </Button>
        <Button onClick={onCancel}>{cancelButtonLabel ?? 'Cancel'}</Button>
      </DialogActions>
    )}
  </DialogContent>
);

type PromptDialogPresentationProps = PromptDialogFormProps &
  Readonly<{
    open: boolean;
    title: string;
  }>;

const PromptDialogPresentation: React.FunctionComponent<
  PromptDialogPresentationProps
> = ({ onCancel, open, title, ...rest }: PromptDialogPresentationProps) => (
  <DraggableDialog open={open} title={title} onClose={onCancel}>
    <PromptDialogForm {...rest} onCancel={onCancel} />
  </DraggableDialog>
);

// TODO: remove 'any' types from here once the store is properly annotated

const PromptDialog = connect<PromptDialogPresentationProps>(
  // mapStateToProps
  (state: any): any => state.dialogs.prompt as PromptSliceState,

  // mapDispatchToProps
  (dispatch) => ({
    onCancel(): void {
      dispatch(cancelPromptDialog() as any);
    },

    onSubmit({ formData }: { formData: Record<string, any> }): void {
      dispatch(submitPromptDialog(formData) as any);
    },
  })
)(PromptDialogPresentation);

export default PromptDialog;
