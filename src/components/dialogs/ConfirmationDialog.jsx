/**
 * Reusable yes/cancel confirmation dialog (MUI + DraggableDialog).
 */

import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { DraggableDialog } from '@skybrush/mui-components';

const ConfirmationDialog = ({
  cancelLabel,
  children,
  confirmLabel,
  message,
  onCancel,
  onConfirm,
  open,
  title,
}) => {
  const { t } = useTranslation();

  return (
    <DraggableDialog
      maxWidth='xs'
      open={open}
      title={title ?? t('general.confirmDialog.title')}
    >
      <DialogContent>
        {message ? (
          <DialogContentText component='div'>{message}</DialogContentText>
        ) : (
          children
        )}
      </DialogContent>
      <DialogActions>
        <Button color='primary' variant='contained' onClick={onConfirm}>
          {confirmLabel ?? t('general.action.yes')}
        </Button>
        <Button onClick={onCancel}>
          {cancelLabel ?? t('general.action.cancel')}
        </Button>
      </DialogActions>
    </DraggableDialog>
  );
};

ConfirmationDialog.propTypes = {
  cancelLabel: PropTypes.string,
  children: PropTypes.node,
  confirmLabel: PropTypes.string,
  message: PropTypes.node,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  title: PropTypes.string,
};

export default ConfirmationDialog;
