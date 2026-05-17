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

import { type AppDispatch, type RootState } from '~/store/reducers';

import { cancelPromptDialog, submitPromptDialog } from './actions';
import { PromptDialogType, type PromptOptions } from './types';

type PromptDialogFormProps = Pick<
  PromptOptions,
  | 'cancelButtonLabel'
  | 'initialValues'
  | 'message'
  | 'schema'
  | 'submitButtonLabel'
> &
  Readonly<{
    onCancel: () => void;
    onSubmit: (event: { formData?: Record<string, any> }) => void;
    optimizeUIForTouch?: boolean;
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
      {/* TODO: Make sure that `GENERIC` prompt dialogs always have `schema` */}
      {type === PromptDialogType.GENERIC && schema !== undefined && (
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
    title?: string;
  }>;

const PromptDialogPresentation: React.FunctionComponent<
  PromptDialogPresentationProps
> = ({ onCancel, open, title, ...rest }: PromptDialogPresentationProps) => (
  <DraggableDialog open={open} title={title} onClose={onCancel}>
    <PromptDialogForm {...rest} onCancel={onCancel} />
  </DraggableDialog>
);

const PromptDialog = connect(
  // mapStateToProps
  (state: RootState) => state.dialogs.prompt,

  // mapDispatchToProps
  (dispatch: AppDispatch) => ({
    onCancel(): void {
      dispatch(cancelPromptDialog());
    },

    onSubmit({ formData }: { formData?: Record<string, any> }): void {
      dispatch(submitPromptDialog(formData));
    },
  })
)(PromptDialogPresentation);

export default PromptDialog;
