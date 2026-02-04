/**
 * @file Generic input dialog to request data from the user based on a schema.
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import { Form } from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import { cancelPromptDialog, submitPromptDialog } from './actions';
import type { PromptSliceState } from './slice';
import { PromptDialogType, type PromptOptions } from './types';

type FormValues = {
  value: string;
};

type PromptDialogFormProps = Pick<
  PromptOptions,
  'cancelButtonLabel' | 'message' | 'submitButtonLabel'
> &
  Readonly<{
    initialValues: FormValues;
    onCancel: () => void;
    onSubmit: (event: { formData?: Record<string, any> }) => void;
    optimizeUIForTouch?: boolean;
    schema: Record<string, any>;
    type: PromptDialogType;
  }>;

const PromptDialogForm: React.FunctionComponent<PromptDialogFormProps> = ({
  cancelButtonLabel,
  initialValues,
  message,
  onCancel,
  onSubmit,
  schema,
  submitButtonLabel,
  type,
}) => {
  const { t } = useTranslation();
  return (
    <DialogContent>
      {message && (
        <Box sx={{ py: 1 }}>
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
              {submitButtonLabel ?? t('general.action.submit')}
            </Button>
            <Button onClick={onCancel}>
              {cancelButtonLabel ?? t('general.action.cancel')}
            </Button>
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
            {submitButtonLabel ?? t('general.action.confirm')}
          </Button>
          <Button onClick={onCancel}>
            {cancelButtonLabel ?? t('general.action.cancel')}
          </Button>
        </DialogActions>
      )}
    </DialogContent>
  );
};

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
